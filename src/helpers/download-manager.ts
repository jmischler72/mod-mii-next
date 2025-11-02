import { getDatabaseEntry } from '@/helpers/database-helper';
import {  nusDownload } from '@/helpers/wiipy-wrapper';
import { fileExistsInS3, uploadFileToS3, generateWadS3Key, generatePresignedUrl } from '@/helpers/s3-storage';
import fs from 'fs';
import path from 'path';
import { oscDownload } from './osc-download';
import { createHash } from 'crypto';
import { DatabaseEntry } from '@/types/database';
import { buildD2xCios } from './ios-builder/build-d2x-cios';
import { patchIos } from './ios-builder/patch-ios';
import { buildHazaIos } from './ios-builder/build-haza-ios';

// Temporary directory for downloads (will be deleted after S3 upload)
export const TEMP_DIRECTORY = process.env.TEMP_DIRECTORY || path.join(process.cwd(), 'temp-downloads');

export interface DownloadResult {
	success: boolean;
	wadname: string;
	cached: boolean;
	s3Key?: string;
	s3Url?: string;
	error?: string;
}

export interface DownloadSummary {
	totalRequested: number;
	downloaded: number;
	cached: number;
	failed: number;
	results: DownloadResult[];
}

/**
 * Ensures the temporary directory exists for downloads
 */
function ensureTempDirectory(): string {
	if (!fs.existsSync(TEMP_DIRECTORY)) {
		fs.mkdirSync(TEMP_DIRECTORY, { recursive: true });
	}

	return TEMP_DIRECTORY;
}

/**
 * Clean up temporary file
 */
function cleanupTempFile(filePath: string): void {
	try {
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	} catch (error) {
		console.warn(`Failed to cleanup temp file ${filePath}:`, error);
	}
}

/**
 * Verify the downloaded file matches the expected hash
 */
export async function verifyFile(filePath: string, md5: string, md5alt?: string): Promise<void> {
	if (!md5 && !md5alt) {
		throw new Error(`No MD5 hash provided for file verification: ${filePath}`);
	}

	const fileBuffer = fs.readFileSync(filePath);

	const hash = createHash('md5').update(fileBuffer).digest('hex');
	if (hash === md5) return;

	const altHash = createHash('md5').update(fileBuffer).digest('hex');
	if (altHash === md5alt) return;

	throw new Error(
		`File verification failed for ${filePath}, expected MD5: ${md5}, got: ${hash}, alternative MD5: ${md5alt}, got: ${altHash}`,
	);
}

async function downloadWadFile(entry: DatabaseEntry, outputPath: string) {
	if (fs.existsSync(outputPath)) {
		try {
			await verifyFile(outputPath, entry.md5, entry.md5alt);
			return Promise.resolve(`WAD ${entry.wadname} found in cache`);
		} catch (err) {
			console.warn('NUS: Cached file verification failed, re-downloading');
		}
	}

	if (!entry.category && !entry.ciosslot) {
		throw new Error(`Unsupported category for download: ${entry.category}`);
	}

	if (entry.name.includes("HAZA")) {
		await buildHazaIos(outputPath);
	}

	switch (entry.category) {
		case 'ios':
			await nusDownload(entry, outputPath);
			break;
		case 'OSC':
			await oscDownload(entry, outputPath);
			break;
		case 'd2x':
			await buildD2xCios(entry, outputPath);
			break;
		case 'patchios':
			await patchIos(entry, outputPath);
			break;
		default:
			break;
	}

	if (!entry.md5 && entry.category === 'OSC') return;
	if (entry.category === 'patchios') return;
	await verifyFile(outputPath, entry.md5, entry.md5alt);
}

/**
 * Download a single WAD file with S3-only storage
 */
export async function handleDownloadWadFile(wadId: string): Promise<DownloadResult> {
	const databaseEntry = getDatabaseEntry(wadId);

	if (!databaseEntry) {
		throw new Error(`No entry found in database for ${wadId}`);
	}
	console.log(`Downloading: ${databaseEntry?.wadname}`);

	const s3Key = generateWadS3Key(databaseEntry.wadname);

	// Check if file already exists in S3
	const existsInS3 = await fileExistsInS3(s3Key);

	if (!existsInS3) {
		// Download the file to temporary location
		const tempPath = ensureTempDirectory();
		const outputPath = path.join(tempPath, databaseEntry.wadname);

		await downloadWadFile(databaseEntry, outputPath);

		// Verify the file was downloaded
		if (!outputPath || !fs.existsSync(outputPath)) {
			throw new Error(`File was not created after download: ${databaseEntry.wadname}`);
		}

		// Upload to S3
		await uploadFileToS3(outputPath, s3Key, 'application/octet-stream');

		// Clean up temporary file
		cleanupTempFile(outputPath);

		console.log(`Successfully uploaded ${databaseEntry.wadname} to S3`);
	}

	const presignedUrl = await generatePresignedUrl(s3Key, 86400);

	return {
		success: true,
		wadname: databaseEntry.wadname,
		cached: existsInS3,
		s3Key,
		s3Url: presignedUrl,
	};
}

/**
 * Download multiple WAD files with progress tracking
 */
export async function handleDownloadMultipleWads(
	wadIds: string[],
	options: {
		maxConcurrent?: number;
		onProgress?: (completed: number, total: number, current: string) => void;
	} = {},
): Promise<DownloadSummary> {
	const { maxConcurrent = 3 } = options;
	const results: DownloadResult[] = [];
	const total = wadIds.length;

	console.log(`Starting download of ${total} WAD files...`);

	// Process downloads in batches to avoid overwhelming the server
	for (let i = 0; i < wadIds.length; i += maxConcurrent) {
		const batch = wadIds.slice(i, i + maxConcurrent);

		const batchPromises = batch.map(async (wadId) => {
			return await handleDownloadWadFile(wadId).catch((error) => {
				console.error(`Error downloading ${wadId}: ${error.message}`);
				return {
					success: false,
					wadname: wadId,
					cached: false,
				};
			});
		});

		const batchResults = await Promise.all(batchPromises);
		results.push(...batchResults);
	}

	const summary: DownloadSummary = {
		totalRequested: total,
		downloaded: results.filter((r) => r.success && !r.cached).length,
		cached: results.filter((r) => r.success && r.cached).length,
		failed: results.filter((r) => !r.success).length,
		results,
	};

	console.log(`Download summary: ${summary.downloaded} downloaded, ${summary.cached} cached, ${summary.failed} failed`);

	if (summary.failed > 0) {
		const failedFiles = results.filter((r) => !r.success).map((r) => r.wadname);
		console.log(`Failed downloads: ${failedFiles.join(', ')}`);
	}

	return summary;
}
