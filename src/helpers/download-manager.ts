import { getEntry } from '@/helpers/database-helper';
import { nusDownload } from '@/helpers/wiipy-wrapper';
import { fileExistsInS3, uploadFileToS3, generateWadS3Key, generatePresignedUrl } from '@/helpers/s3-storage';
import fs from 'fs';
import path from 'path';

// Temporary directory for downloads (will be deleted after S3 upload)
const TEMP_DIRECTORY = path.join(process.cwd(), '.temp-downloads');

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
function ensureTempDirectory(): void {
	if (!fs.existsSync(TEMP_DIRECTORY)) {
		fs.mkdirSync(TEMP_DIRECTORY, { recursive: true });
	}
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
 * Download a single WAD file with S3-only storage
 */
export async function downloadWadFile(wadId: string): Promise<DownloadResult> {
	try {
		const entry = getEntry(wadId);

		if (!entry) {
			return {
				success: false,
				wadname: wadId,
				cached: false,
				error: `No entry found in database for ${wadId}`,
			};
		}

		const s3Key = generateWadS3Key(entry.wadname);

		// Check if file already exists in S3
		if (await fileExistsInS3(s3Key)) {
			console.log(`WAD ${entry.wadname} found in S3`);
			const presignedUrl = await generatePresignedUrl(s3Key, 86400); // 24 hours

			return {
				success: true,
				wadname: entry.wadname,
				cached: true,
				s3Key,
				s3Url: presignedUrl,
			};
		}

		// Download the file to temporary location
		ensureTempDirectory();
		const tempPath = path.join(TEMP_DIRECTORY, entry.wadname);

		console.log(`Downloading ${entry.wadname}...`);
		await nusDownload(entry.code1, entry.code2, entry.version.toString(), entry.wadname);

		// Note: nusDownload should save to TEMP_DIRECTORY
		// Update wiipy-wrapper to use TEMP_DIRECTORY instead of CACHE_DIRECTORY

		// Verify the file was downloaded
		if (!fs.existsSync(tempPath)) {
			return {
				success: false,
				wadname: entry.wadname,
				cached: false,
				error: `File was not created after download: ${entry.wadname}`,
			};
		}

		// Upload to S3
		const s3Url = await uploadFileToS3(tempPath, s3Key, 'application/octet-stream');

		// Clean up temporary file
		cleanupTempFile(tempPath);

		console.log(`Successfully uploaded ${entry.wadname} to S3`);

		const presignedUrl = await generatePresignedUrl(s3Key, 86400);

		return {
			success: true,
			wadname: entry.wadname,
			cached: false,
			s3Key,
			s3Url: presignedUrl,
		};
	} catch (error) {
		console.error(`Failed to download ${wadId}:`, error);
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
export async function downloadMultipleWads(
	wadIds: string[],
	options: {
		maxConcurrent?: number;
		onProgress?: (completed: number, total: number, current: string) => void;
	} = {},
): Promise<DownloadSummary> {
	const { maxConcurrent = 3, onProgress } = options;
	const results: DownloadResult[] = [];
	const total = wadIds.length;
	let completed = 0;

	console.log(`Starting download of ${total} WAD files...`);

	// Process downloads in batches to avoid overwhelming the server
	for (let i = 0; i < wadIds.length; i += maxConcurrent) {
		const batch = wadIds.slice(i, i + maxConcurrent);

		const batchPromises = batch.map(async (wadId) => {
			if (onProgress) {
				onProgress(completed, total, wadId);
			}

			const result = await downloadWadFile(wadId);
			completed++;

			return result;
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

	return summary;
}

/**
 * Get the S3 info for a cached WAD (S3 only)
 */
export async function getCachedWadPath(wadname: string): Promise<{
	s3Key?: string;
	s3Url?: string;
} | null> {
	const s3Key = generateWadS3Key(wadname);

	if (!(await fileExistsInS3(s3Key))) {
		return null;
	}

	try {
		const s3Url = await generatePresignedUrl(s3Key, 86400);

		return {
			s3Key,
			s3Url,
		};
	} catch (error) {
		console.error(`Failed to generate presigned URL for ${wadname}:`, error);
		return {
			s3Key,
			s3Url: undefined,
		};
	}
}

/**
 * Clean up old temporary files (optional maintenance function)
 */
export function cleanOldTempFiles(): void {
	try {
		if (!fs.existsSync(TEMP_DIRECTORY)) {
			return;
		}

		const files = fs.readdirSync(TEMP_DIRECTORY);

		files.forEach((file) => {
			const filePath = path.join(TEMP_DIRECTORY, file);
			try {
				fs.unlinkSync(filePath);
				console.log(`Cleaned up temp file: ${file}`);
			} catch (error) {
				console.warn(`Failed to clean up temp file ${file}:`, error);
			}
		});
	} catch (error) {
		console.warn('Failed to clean temp directory:', error);
	}
}
