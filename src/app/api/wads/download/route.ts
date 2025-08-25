import { NextRequest, NextResponse } from 'next/server';
import { handleDownloadWadFile } from '@/helpers/download-manager';
import { getFileBufferFromS3, generateWadS3Key } from '@/helpers/s3-storage';

export async function POST(request: NextRequest) {
	try {
		const { wadId } = await request.json();

		if (!wadId || typeof wadId !== 'string') {
			return NextResponse.json({ error: 'wadId is required' }, { status: 400 });
		}

		console.log('Downloading WAD file with ID:', wadId);

		// Download the file using the wadId (this ensures it's in S3)
		const downloadResult = await handleDownloadWadFile(wadId);

		if (!downloadResult.success) {
			return NextResponse.json({ error: downloadResult.error || 'Download failed' }, { status: 500 });
		}

		// Get the file buffer from S3
		const s3Key = generateWadS3Key(downloadResult.wadname);
		const fileBuffer = await getFileBufferFromS3(s3Key);

		// Return the file as a direct download
		return new NextResponse(Uint8Array.from(fileBuffer), {
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${downloadResult.wadname}"`,
				'Content-Length': fileBuffer.length.toString(),
				'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
			},
		});
	} catch (error) {
		console.error('Error downloading WAD file:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
