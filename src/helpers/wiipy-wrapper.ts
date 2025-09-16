import { CustomError } from '@/types/custom-error';
import { spawn } from 'child_process';
import fs from 'fs';
import { verifyFile } from './download-manager';
import { DatabaseEntry } from '@/types/database';

const WIIPY_PATH = process.env.WIIPY_PATH || '/wiipy';

const wiipyCommand = `python3 ${WIIPY_PATH}/wiipy.py`;

export async function runWiiPyCommand(args: string, outputStr?: string, debug: boolean = false): Promise<string> {
	return new Promise((resolve, reject) => {
		const callerId = args.split(' ')[0] + (outputStr ? ` (${outputStr})` : '');

		const child = spawn(wiipyCommand, [args], { shell: true });

		child.stdout.on('data', (data) => {
			data
				.toString()
				.split('\n')
				.filter((line: string) => line.trim() !== '')
				.forEach((line: string) => console.log(`[${callerId}] Out: ${line}`));
		});

		child.stderr.on('data', (data) => {
			data
				.toString()
				.split('\n')
				.filter((line: string) => line.trim() !== '')
				.forEach((line: string) => console.error(`[${callerId}] Err: ${line}`));
		});

		child.on('close', (code) => {
			if (code === 0) {
				resolve(`[${callerId}] Command "${wiipyCommand} ${args}" executed successfully`);
			} else {
				reject(new CustomError(`[${callerId}] Command "${wiipyCommand} ${args}" failed with code ${code}`));
			}
		});
	});
}

export async function nusDownload(entry: DatabaseEntry, outputPath: string) {
	if (fs.existsSync(outputPath)) {
		try {
			await verifyFile(outputPath, entry.md5, entry.md5alt);
			return Promise.resolve(`WAD ${entry.wadname} found in cache`);
		} catch (err) {
			console.warn('NUS: Cached file verification failed, re-downloading');
		}
	}

	const args = `nus title ${entry.code1}${entry.code2} -v ${entry.version} --wad ${outputPath}`;
	return runWiiPyCommand(args);
}

