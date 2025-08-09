import { DatabaseEntry, getDatabaseEntry } from '@/helpers/database-helper';
import { buildCios, nusDownload, patchIos } from '@/helpers/wiipy-wrapper';
import { fileExistsInS3, uploadFileToS3, generateWadS3Key, generatePresignedUrl } from '@/helpers/s3-storage';
import fs from 'fs';
import path from 'path';
import { oscDownload } from './osc-download';
import { CustomError } from '@/types/custom-error';
import { createHash } from 'crypto';

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
		throw new CustomError(`No MD5 hash provided for file verification: ${filePath}`);
	}

	const fileBuffer = fs.readFileSync(filePath);
	const hash = createHash('md5').update(fileBuffer).digest('hex');
	if (hash !== md5) {
		if (md5alt) {
			console.log('verifying with alternative MD5 hash');
			const altHash = createHash('md5').update(fileBuffer).digest('hex');
			if (altHash !== md5alt) {
				throw new CustomError(`File verification failed for ${filePath}`);
			}
		} else {
			throw new CustomError(`File verification failed for ${filePath}`);
		}
	} else {
		console.log(`MD5 Verification successful for ${filePath} `);
	}
}

async function downloadWadFile(entry: DatabaseEntry, outputPath: string) {
	if (!entry.category && !entry.ciosslot) {
		throw new CustomError(`Unsupported category for download: ${entry.category}`);
	}

	if (entry.ciosslot && !entry.category) {
		// this means the wad is a patched ios or cios so we need to build it using base wad
		const baseWadPath = `/tmp/${entry.basewad}.wad`;
		await nusDownload(entry, baseWadPath);
		await buildCios(entry, outputPath, baseWadPath);
	} else {
		switch (entry.category) {
			case 'ios':
				await nusDownload(entry, outputPath);
				break;
			case 'OSC':
				await oscDownload(entry, outputPath);
				break;
			case 'patchios':
				const baseWadPath = `/tmp/${entry.basewad}.wad`;
				await nusDownload(entry, baseWadPath);
				await verifyFile(baseWadPath, entry.md5base!, entry.md5basealt);
				await patchIos(entry, outputPath, baseWadPath);
				break;
			default:
				break;
		}
	}

	if (entry.md5) {
		await verifyFile(outputPath, entry.md5, entry.md5alt);
	} else {
		console.warn(`No MD5 hash provided for file verification: ${outputPath}`);
	}
}

/**
 * Download a single WAD file with S3-only storage
 */
export async function handleDownloadWadFile(wadId: string): Promise<DownloadResult> {
	try {
		const databaseEntry = getDatabaseEntry(wadId);

		if (!databaseEntry) {
			throw new CustomError(`No entry found in database for ${wadId}`);
		}
		console.log(`Downloading: ${databaseEntry?.wadname}`);

		const s3Key = generateWadS3Key(databaseEntry.wadname);

		// Check if file already exists in S3
		if (await fileExistsInS3(s3Key)) {
			const presignedUrl = await generatePresignedUrl(s3Key, 86400); // 24 hours

			return {
				success: true,
				wadname: databaseEntry.wadname,
				cached: true,
				s3Key,
				s3Url: presignedUrl,
			};
		}

		// Download the file to temporary location
		const tempPath = ensureTempDirectory();
		const outputPath = path.join(tempPath, databaseEntry.wadname);

		await downloadWadFile(databaseEntry, outputPath);

		// Verify the file was downloaded
		if (!outputPath || !fs.existsSync(outputPath)) {
			throw new CustomError(`File was not created after download: ${databaseEntry.wadname}`);
		}

		// Upload to S3
		await uploadFileToS3(outputPath, s3Key, 'application/octet-stream');

		// Clean up temporary file
		cleanupTempFile(outputPath);

		console.log(`Successfully uploaded ${databaseEntry.wadname} to S3`);

		const presignedUrl = await generatePresignedUrl(s3Key, 86400);

		return {
			success: true,
			wadname: databaseEntry.wadname,
			cached: false,
			s3Key,
			s3Url: presignedUrl,
		};
	} catch (error) {
		console.error(`Failed to download ${wadId}:`);
		return {
			success: false,
			wadname: wadId,
			cached: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
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
			return await handleDownloadWadFile(wadId);
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
