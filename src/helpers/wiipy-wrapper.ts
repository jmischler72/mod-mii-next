import { CustomError } from '@/types/custom-error';
import { spawn } from 'child_process';
import fs from 'fs';
import { DatabaseEntry } from './database-helper';

const WIIPY_PATH = process.env.WIIPY_PATH || '/wiipy';
const MODMII_PATH = process.env.MODMII_PATH || '/modmii';

const wiipyCommand = `python3 ${WIIPY_PATH}/wiipy.py`;
const nusCommand = `${wiipyCommand} nus title`;

export function nusDownload(databaseEntry: DatabaseEntry, outputPath: string) {
	// Check if WAD already exists
	if (fs.existsSync(outputPath)) {
		console.log(`WAD ${databaseEntry.wadname} already exists in cache`);
		return Promise.resolve(`WAD ${databaseEntry.wadname} found in cache`);
	}

	const fullCommand = `${nusCommand} ${databaseEntry.code1}${databaseEntry.code2} -v ${databaseEntry.version} --wad ${outputPath}`;
	const child = spawn(fullCommand, [], { shell: true });

	child.stdout.on('data', (data) => {
		console.log(`Output: ${data}`);
	});

	child.stderr.on('data', (data) => {
		console.error(`Error: ${data}`);
	});

	return new Promise<string>((resolve, reject) => {
		child.on('close', (code) => {
			if (code === 0) {
				resolve(`WAD ${databaseEntry.wadname} downloaded successfully`);
			} else {
				reject(new CustomError(`Command failed with code ${code}`));
			}
		});
	});
}

export async function buildCios(entry: DatabaseEntry, outputPath: string, baseWadPath: string) {
	const d2xModules = `${MODMII_PATH}/Support/d2xModules`;
	const ciosMapPath = `${d2xModules}/ciosmaps.xml`;

	const ciosVersion = entry.wadname.substring(12).replace('.wad', '');

	const args = ` --cios-ver ${ciosVersion} --modules ${d2xModules} --slot ${entry.ciosslot} --version ${entry.ciosversion} `;

	const ciosBuilderCommand = `${wiipyCommand} cios ${baseWadPath} ${ciosMapPath} ${outputPath} ${args}`;

	const child = spawn(ciosBuilderCommand, [], { shell: true });

	child.stdout.on('data', (data) => {
		console.log(`Output: ${data}`);
	});

	child.stderr.on('data', (data) => {
		console.error(`Error: ${data}`);
	});
	return new Promise<void>((resolve, reject) => {
		child.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				console.error(`CiosBuilder command failed with code ${code}`);
				reject(new CustomError(`CiosBuilder command failed with code ${code}`));
			}
		});
	});
}
