import { NextRequest, NextResponse } from 'next/server';
import { handleDownloadMultipleWads } from '@/helpers/download-manager';
import { createArchive } from '@/actions/create-archive';

export async function POST(request: NextRequest) {
	const { wadnames } = await request.json();

	try {
		// Check if wadToInstall is provided
		if (!wadnames || !Array.isArray(wadnames)) {
			return NextResponse.json({ error: 'wadToInstall array is required' }, { status: 400 });
		}

		console.log('Downloading WAD files:', wadnames);

		// Download all required WAD files
		const downloadSummary = await handleDownloadMultipleWads(wadnames, {
			maxConcurrent: 2, // Download 2 files at a time to avoid overwhelming the server
			onProgress: (completed, total, current) => {
				console.log(`Download progress: ${completed}/${total} - Currently downloading: ${current}`);
			},
		});

		console.log('Download Summary:', downloadSummary);

		// Use the successfully downloaded files for archiving
		const availableFiles = downloadSummary.results
			.filter((r) => r.success && r.s3Key && r.s3Url)
			.map((r) => ({
				wadname: r.wadname,
				s3Key: r.s3Key!,
				s3Url: r.s3Url!,
			}));

		if (availableFiles.length === 0) {
			return NextResponse.json(
				{
					error: 'No files were successfully downloaded',
				},
				{ status: 400 },
			);
		}

		const zipBuffer = await createArchive(availableFiles, downloadSummary);

		return new NextResponse(zipBuffer, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': 'attachment; filename="wad-files.zip"',
				'Content-Length': zipBuffer.length.toString(),
				'X-Download-Summary': JSON.stringify({
					downloaded: downloadSummary.downloaded,
					cached: downloadSummary.cached,
					failed: downloadSummary.failed,
					failedFiles: downloadSummary.results.filter((r) => !r.success).map((r) => r.wadname),
				}),
			},
		});
	} catch (error) {
		console.error('Error creating archive:', error);
		return NextResponse.json({ error: 'Failed to create archive' }, { status: 500 });
	}
}
