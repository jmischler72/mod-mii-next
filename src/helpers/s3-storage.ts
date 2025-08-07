import * as Minio from 'minio';
import fs from 'fs';
import path from 'path';

// MinIO Configuration
const MINIO_CONFIG = {
	endPoint: process.env.MINIO_ENDPOINT || 'localhost',
	port: parseInt(process.env.MINIO_PORT || '9000'),
	useSSL: process.env.MINIO_USE_SSL === 'true' || false,
	accessKey: process.env.MINIO_ROOT_USER || 'admin',
	secretKey: process.env.MINIO_ROOT_PASSWORD || 'password123',
};

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'wii-homebrew-files';

// Initialize MinIO client
let minioClient: Minio.Client | null = null;

function getMinioClient(): Minio.Client {
	if (!minioClient) {
		minioClient = new Minio.Client(MINIO_CONFIG);
	}
	return minioClient;
}

/**
 * Check if a file exists in S3
 */
export async function fileExistsInS3(key: string): Promise<boolean> {
	try {
		const client = getMinioClient();
		await client.statObject(BUCKET_NAME, key);
		return true;
	} catch {
		return false;
	}
}

/**
 * Upload a file to S3
 */
export async function uploadFileToS3(
	localFilePath: string,
	s3Key: string,
	contentType: string = 'application/octet-stream',
): Promise<string> {
	if (!fs.existsSync(localFilePath)) {
		throw new Error(`Local file does not exist: ${localFilePath}`);
	}

	const client = getMinioClient();

	const metaData = {
		'Content-Type': contentType,
		'upload-date': new Date().toISOString(),
		'original-filename': path.basename(localFilePath),
	};

	await client.fPutObject(BUCKET_NAME, s3Key, localFilePath, metaData);

	return getPublicMinioUrl(s3Key);
}

/**
 * Download a file from S3 to local storage
 */
export async function downloadFileFromS3(s3Key: string, localFilePath: string): Promise<string> {
	const client = getMinioClient();

	// Ensure the directory exists
	const dir = path.dirname(localFilePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	await client.fGetObject(BUCKET_NAME, s3Key, localFilePath);

	console.log(`Successfully downloaded ${s3Key} from MinIO`);
	return localFilePath;
}

/**
 * Generate a presigned URL for direct download
 */
export async function generatePresignedUrl(
	s3Key: string,
	expiresIn: number = 3600, // 1 hour default
): Promise<string> {
	const client = getMinioClient();

	const url = await client.presignedGetObject(BUCKET_NAME, s3Key, expiresIn);
	return url;
}

/**
 * Generate S3 key for a WAD file
 */
export function generateWadS3Key(wadname: string): string {
	// Store files directly in wad-files folder without date organization
	return `wad-files/${wadname}`;
}

/**
 * Get the MinIO URL for a WAD file (for public buckets)
 */
export function getPublicMinioUrl(s3Key: string): string {
	const protocol = MINIO_CONFIG.useSSL ? 'https' : 'http';
	return `${protocol}://${MINIO_CONFIG.endPoint}:${MINIO_CONFIG.port}/${BUCKET_NAME}/${s3Key}`;
}

/**
 * Initialize MinIO bucket (call this on startup)
 */
export async function initializeS3(): Promise<void> {
	const client = getMinioClient();

	try {
		// Check if bucket exists, create if it doesn't
		const bucketExists = await client.bucketExists(BUCKET_NAME);

		if (!bucketExists) {
			await client.makeBucket(BUCKET_NAME);
			console.log(`Created MinIO bucket: ${BUCKET_NAME}`);
		}

		console.log('MinIO connection verified - bucket is accessible');
	} catch (error) {
		console.error('Failed to initialize MinIO:', error);
		throw new Error(`Failed to initialize MinIO: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}
