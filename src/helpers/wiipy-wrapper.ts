import { CustomError } from '@/types/custom-error';
import { spawn } from 'child_process';
import fs, { copyFileSync } from 'fs';
import { DatabaseEntry } from './database-helper';

const WIIPY_PATH = process.env.WIIPY_PATH || '/wiipy';
const MODMII_PATH = process.env.MODMII_PATH || '/modmii';

const wiipyCommand = `python3 ${WIIPY_PATH}/wiipy.py`;

export async function runCommand(args: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = spawn(wiipyCommand, [args], { shell: true });

		child.stdout.on('data', (data) => {
			console.log(`Output: ${data}`);
		});

		child.stderr.on('data', (data) => {
			console.error(`Error: ${data}`);
		});

		child.on('close', (code) => {
			if (code === 0) {
				resolve(`Command "${wiipyCommand} ${args}" executed successfully`);
			} else {
				reject(new CustomError(`Command "${wiipyCommand} ${args}" failed with code ${code}`));
			}
		});
	});
}

export function nusDownload(databaseEntry: DatabaseEntry, outputPath: string) {
	// Check if WAD already exists
	if (fs.existsSync(outputPath)) {
		console.log(`WAD ${databaseEntry.wadname} already exists in cache`);
		return Promise.resolve(`WAD ${databaseEntry.wadname} found in cache`);
	}

	const args = `nus title ${databaseEntry.code1}${databaseEntry.code2} -v ${databaseEntry.version} --wad ${outputPath}`;
	return runCommand(args);
}

export async function buildCios(entry: DatabaseEntry, outputPath: string, baseWadPath: string) {
	const d2xModules = `${MODMII_PATH}/Support/d2xModules`;
	const ciosMapPath = `${d2xModules}/ciosmaps.xml`;

	const ciosVersion = entry.wadname.substring(12).replace('.wad', '');

	const args = `cios --cios-ver ${ciosVersion} --modules ${d2xModules} --slot ${entry.ciosslot} --version ${entry.ciosversion} ${baseWadPath} ${ciosMapPath} ${outputPath}`;

	return runCommand(args);
}

export async function patchIos(entry: DatabaseEntry, outputPath: string, baseWadPath: string) {
	const tmpOutputPath = `${outputPath}`.replace('(', '').replace(')', ''); // wiipy does not like parentheses in file paths
	const isLastBaseModule = true;
	const lastBaseModule = isLastBaseModule ? `-s ${entry.ciosslot} -v ${entry.ciosversion}` : '';

	const args = `iospatch -fs -ei -na -vd ${lastBaseModule} ${baseWadPath} -o ${tmpOutputPath}`;
	return await runCommand(args).then(() => {
		return copyFileSync(tmpOutputPath, outputPath);
	});
}
