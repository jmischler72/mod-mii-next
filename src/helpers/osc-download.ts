import { DatabaseEntry } from './database-helper';
import fs from 'fs';

const OSC_URL = 'https://hbb1.oscwii.org/api/contents/';
export async function oscDownload(databaseEntry: DatabaseEntry, tempPath: string, filePath: string) {
	try {
		// Download Apps-master.zip
		const fileUrl = `${OSC_URL}${databaseEntry.code1}/${databaseEntry.code1}.zip`;
		await downloadFile(fileUrl, filePath);

		console.log('OSC download process completed');
	} catch (error) {
		console.error('OSC download failed:', error);
		throw error;
	}

	async function downloadFile(url: string, filepath: string): Promise<void> {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to download: ${response.statusText}`);
		}

		const buffer = await response.arrayBuffer();
		await fs.promises.writeFile(filepath, Buffer.from(buffer));
	}

	// async function getLatestAppVersion(appName: string): Promise<string> {
	// 	const metaUrl = `https://hbb1.oscwii.org/unzipped_apps/${appName}/apps/${appName}/meta.xml`;
	// 	try {
	// 		const response = await fetch(metaUrl);
	// 		const metaContent = await response.text();
	// 		const versionMatch = metaContent.match(/<version>(.*?)<\/version>/);
	// 		return versionMatch ? versionMatch[1].replace(/^v/, '') : '';
	// 	} catch {
	// 		return '';
	// 	}
	// }

	// async function downloadOSCApp(appName: string, wadsDirectory: string): Promise<void> {
	// 	const downloadUrl = `https://hbb1.oscwii.org/api/contents/${appName}/${appName}.zip`;
	// 	const zipPath = path.join(tempPath, `${appName}.zip`);

	// 	await downloadFile(downloadUrl, zipPath);

	// 	// Extract to wads directory
	// 	execSync(`7za x -aoa "${zipPath}" -o"${wadsDirectory}" -x!__MACOSX -x!readme*`, { stdio: 'ignore' });

	// 	console.log(`Downloaded and extracted ${appName}`);
	// }
}
