import { CustomError } from '@/types/custom-error';
import { spawn } from 'child_process';
import fs from 'fs';
import { DatabaseEntry } from './database-helper';

const wiipyCommand = 'python3 /WiiPy/wiipy.py';
const nusCommand = `${wiipyCommand} nus title`;

export function nusDownload(databaseEntry: DatabaseEntry, wadPath: string): Promise<string> {
	// Check if WAD already exists
	if (fs.existsSync(wadPath)) {
		console.log(`WAD ${databaseEntry.wadname} already exists in cache`);
		return Promise.resolve(`WAD ${databaseEntry.wadname} found in cache`);
	}

	const fullCommand = `${nusCommand} ${databaseEntry.code1}${databaseEntry.code2} -v ${databaseEntry.version} --wad ${wadPath}`;
	const child = spawn(fullCommand, [], { shell: true });

	let output = '';

	child.stdout.on('data', (data) => {
		const line = data.toString();
		output += line;
	});

	child.stderr.on('data', (data) => {
		console.error(`Error: ${data}`);
	});

	return new Promise((resolve, reject) => {
		child.on('close', (code) => {
			console.log(''); // New line after progress
			if (code === 0) {
				resolve(output);
			} else {
				reject(new CustomError(`Command failed with code ${code}`));
			}
		});
	});
}
