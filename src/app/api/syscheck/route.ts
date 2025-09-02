import { NextRequest, NextResponse } from 'next/server';

const RUNNER_URL = process.env.RUNNER_URL || 'http://localhost:4000';
const WINDOWS_SECRET = process.env.WINDOWS_SECRET;

export async function POST(request: NextRequest) {
	try {
		const { csvContent } = await request.json();

		if (!csvContent || typeof csvContent !== 'string') {
			return NextResponse.json({ error: 'csvContent is required and must be a string' }, { status: 400 });
		}

		if (!WINDOWS_SECRET) {
			return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
		}

		console.log('Processing syscheck CSV...');

		// Call the Python runner service
		const response = await fetch(`${RUNNER_URL}/syscheck`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${WINDOWS_SECRET}`,
			},
			body: JSON.stringify({
				csvContent,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('Runner service error:', errorData);
			return NextResponse.json(
				{
					error: 'Failed to process syscheck',
					details: errorData.error || errorData.details || 'Unknown error',
				},
				{ status: response.status }
			);
		}

		// Check if response is a zip file
		const contentType = response.headers.get('content-type');
		if (contentType === 'application/zip') {
			// Stream the zip file back to the client
			const zipBuffer = await response.arrayBuffer();
			
			return new NextResponse(zipBuffer, {
				headers: {
					'Content-Type': 'application/zip',
					'Content-Disposition': 'attachment; filename="modmii-files.zip"',
					'Content-Length': zipBuffer.byteLength.toString(),
				},
			});
		} else {
			// Handle JSON response (likely an error)
			const jsonData = await response.json();
			return NextResponse.json(jsonData, { status: response.status });
		}
		
	} catch (error) {
		console.error('Error processing syscheck:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}