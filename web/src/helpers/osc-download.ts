import { DatabaseEntry } from '@/types/database';
import fs from 'fs';

const OSC_URL = 'https://hbb1.oscwii.org/api/contents/';

export async function oscDownload(databaseEntry: DatabaseEntry, filePath: string) {
	if (fs.existsSync(filePath)) {
		console.log(`OSC ${databaseEntry.wadname} already exists in cache`);
		return Promise.resolve(`WAD ${databaseEntry.wadname} found in cache`);
	}

	try {
		const fileUrl = `${OSC_URL}${databaseEntry.code1}/${databaseEntry.code1}.zip`;

		console.log(`Downloading ${databaseEntry.wadname} from ${fileUrl}...`);

		const response = await fetch(fileUrl);
		if (!response.ok) {
			throw new Error(`Failed to download: ${response.statusText}`);
		}

		const buffer = await response.arrayBuffer();
		await fs.promises.writeFile(filePath, Buffer.from(buffer));
		console.log('OSC download process completed');
	} catch (error) {
		console.error('OSC download failed:', error);
		throw error;
	}
}
