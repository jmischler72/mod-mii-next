'use server';

import archiver from 'archiver';

export async function createArchive(availableFiles: Array<{ wadname: string; s3Url: string }>) {
	try {
		// Create a zip archive
		const archive = archiver('zip', {
			zlib: { level: 9 }, // Sets the compression level
		});

		// Collect all chunks
		const chunks: Buffer[] = [];

		// Handle archive events
		archive.on('data', (chunk) => {
			chunks.push(chunk);
		});

		archive.on('error', (err) => {
			console.error('Archive error:', err);
			throw err;
		});

		// Download and add files to archive
		const downloadPromises = availableFiles.map(async (file) => {
			try {
				console.log(`Downloading ${file.wadname} from ${file.s3Url}`);
				const response = await fetch(file.s3Url);
				if (response.ok) {
					const buffer = await response.arrayBuffer();
					archive.append(Buffer.from(buffer), { name: file.wadname });
					console.log(`Added ${file.wadname} to archive`);
				} else {
					console.error(`Failed to download ${file.wadname}: ${response.status}`);
				}
			} catch (error) {
				console.error(`Error downloading ${file.wadname}:`, error);
				// Continue with other files
			}
		});

		// Wait for all downloads to complete
		await Promise.all(downloadPromises);

		// Finalize the archive
		archive.finalize();

		// Wait for archive to finish
		await new Promise((resolve, reject) => {
			archive.on('end', resolve);
			archive.on('error', reject);
		});

		const zipBuffer = Buffer.concat(chunks);

		return zipBuffer;
	} catch (error) {
		console.error('Error creating archive:', error);
		throw error;
	}
}
