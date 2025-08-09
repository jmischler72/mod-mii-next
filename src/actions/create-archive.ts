'use server';

import archiver from 'archiver';
import extract from 'extract-zip';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
			const response = await fetch(file.s3Url);

			// if file is zip it should be unarchived
			if (file.wadname.endsWith('.zip')) {
				// Download the zip file to a temporary location
				const buffer = await response.arrayBuffer();
				const tempZipPath = path.join(os.tmpdir(), file.wadname);
				const extractDir = tempZipPath.replace('.zip', '');

				// Write the buffer to a temporary file
				fs.writeFileSync(tempZipPath, Buffer.from(buffer));

				// Extract the downloaded file using extract-zip
				await extract(tempZipPath, { dir: extractDir });
				console.log(`Extracted ${file.wadname} to ${extractDir}`);

				// Add all extracted files to the archive recursively
				const addFilesRecursively = (dir: string, baseDir: string = '') => {
					const items = fs.readdirSync(dir);
					for (const item of items) {
						const itemPath = path.join(dir, item);
						const stats = fs.statSync(itemPath);
						if (stats.isFile()) {
							const fileBuffer = fs.readFileSync(itemPath);
							const relativePath = baseDir ? path.join(baseDir, item) : item;
							archive.append(fileBuffer, { name: relativePath });
						} else if (stats.isDirectory()) {
							const relativePath = baseDir ? path.join(baseDir, item) : item;
							addFilesRecursively(itemPath, relativePath);
						}
					}
				};

				addFilesRecursively(extractDir);

				// Clean up temporary files
				fs.unlinkSync(tempZipPath);
				fs.rmSync(extractDir, { recursive: true, force: true });
			} else {
				const buffer = await response.arrayBuffer();
				archive.append(Buffer.from(buffer), { name: file.wadname });
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
