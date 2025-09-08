import { CustomError } from '@/types/custom-error';
import { spawn } from 'child_process';
import fs, { copyFileSync } from 'fs';
import { verifyFile } from './download-manager';
import { DatabaseEntry } from '@/types/database';
import { getDatabaseEntry, getDatabaseEntryFromWadname } from './database-helper';

const WIIPY_PATH = process.env.WIIPY_PATH || '/wiipy';
const MODMII_PATH = process.env.MODMII_PATH || '/modmii';

const wiipyCommand = `python3 ${WIIPY_PATH}/wiipy.py`;

export async function runCommand(args: string, outputStr?: string, debug: boolean = false): Promise<string> {
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
	return runCommand(args);
}

export async function buildD2xCios(entry: DatabaseEntry, outputPath: string) {
	if (fs.existsSync(outputPath)) {
		try {
			await verifyFile(outputPath, entry.md5, entry.md5alt);
			return Promise.resolve(`WAD ${entry.wadname} found in cache`);
		} catch (err) {
			console.warn('NUS: Cached file verification failed, re-downloading');
		}
	}
	if (!entry.ciosslot || !entry.ciosversion) {
		throw new CustomError(`Missing cIOS slot or version for ${entry.wadname}`);
	}

	// Download base WAD if not already done
	const baseWadPath = `/tmp/${entry.basewad}.wad`;
	await nusDownload(entry, baseWadPath);
	await verifyFile(baseWadPath, entry.md5base!, entry.md5basealt);

	if (!fs.existsSync(baseWadPath)) {
		throw new CustomError(`Base WAD file not found: ${baseWadPath}`);
	}
	const d2xModules = `${MODMII_PATH}/Support/d2xModules`;
	const ciosMapPath = `${d2xModules}/ciosmaps.xml`;

	const ciosVersion = entry.wadname.substring(12).replace('.wad', '');

	const args = `cios --cios-ver ${ciosVersion} --modules ${d2xModules} --slot ${entry.ciosslot} --version ${entry.ciosversion} ${baseWadPath} ${ciosMapPath} ${outputPath}`;

	return runCommand(args, entry.wadname, true);
}

export async function patchIos(entry: DatabaseEntry, outputPath: string) {
	if (fs.existsSync(outputPath)) {
		try {
			await verifyFile(outputPath, entry.md5, entry.md5alt);
			return Promise.resolve(`WAD ${entry.wadname} found in cache`);
		} catch (err) {
			console.warn('NUS: Cached file verification failed, re-downloading');
		}
	}
	if (!entry.ciosslot || !entry.ciosversion) {
		throw new CustomError(`Missing cIOS slot or version for ${entry.wadname}`);
	}
	
	// Download base WAD if not already done
	const baseWadPath = `/tmp/${entry.basewad}.wad`;
	const baseEntry = getDatabaseEntryFromWadname(entry.basewad!);
	if (!baseEntry) throw new Error(`Base WAD entry not found: ${entry.basewad}`);
	await nusDownload(baseEntry, baseWadPath);
	await verifyFile(baseWadPath, entry.md5base!, entry.md5basealt);

	if (!fs.existsSync(baseWadPath)) {
		throw new CustomError(`Base WAD file not found: ${baseWadPath}`);
	}
	const tmpOutputPath = `${outputPath}`.replace('(', '').replace(')', ''); // wiipy does not like parentheses in file paths

	const args = `iospatch -fs -ei -na -vd -s ${entry.ciosslot} -v ${entry.ciosversion} ${baseWadPath} -o ${tmpOutputPath}`;

	return await runCommand(args, entry.wadname, true).then(() => {
		return copyFileSync(tmpOutputPath, outputPath);
	});
}

export async function buildHazaIos(outputPath: string) {
	const entry = getDatabaseEntry('HAZA');
	if (!entry) throw new CustomError('HAZA entry not found in database');
	if (fs.existsSync(outputPath)) {
		try {
			await verifyFile(outputPath, entry.md5, entry.md5alt);
			return Promise.resolve(`WAD ${entry.wadname} found in cache`);
		} catch (err) {
			console.warn('NUS: Cached file verification failed, re-downloading');
		}
	}

// 	if not exist "temp\Photo-Channel-1.1-dummy-HAZA.wad" copy /y "temp\Photo-Channel-1.0-NUS-v2.wad" "temp\Photo-Channel-1.1-dummy-HAZA.wad">nul

// ::Fails without unpacking first-change the title ID to HAZA and change title type (full title ID is 0001000048415A41)
// ::support\sfk replace "temp\Photo-Channel-1.1-dummy-HAZA.wad" -binary /0001000248414141/0001000048415A41/ -yes>nul

// ::change boot index to 0 (at offset 0x1E0 of TMD or 0xEE0 of WAD)
// support\sfk setbytes "temp\Photo-Channel-1.1-dummy-HAZA.wad" 0xEE0 0x0000 -yes>nul

// ::ultimately unnecessary: change IOS to 61 at tmd offset 0x18B, 0xE8B of wad (len 1)
// ::support\sfk setbytes "temp\Photo-Channel-1.1-dummy-HAZA.wad" 0xE8B 0x3D -yes>nul

// ::Also remove all of the contents except content 0 (the banner)
// %WiiPy% wad remove -i 3 "temp\Photo-Channel-1.1-dummy-HAZA.wad"
// %WiiPy% wad remove -i 2 "temp\Photo-Channel-1.1-dummy-HAZA.wad"
// %WiiPy% wad remove -i 1 "temp\Photo-Channel-1.1-dummy-HAZA.wad"

// ::later if\when wiipy is updated to properly handle tmd edits during remove operations the below unpack\repack commands can be removed
// if exist "temp\__channel" rd /s /q "temp\__channel"> nul
// mkdir "temp\__channel"
// %WiiPy% wad unpack --skip-hash "temp\Photo-Channel-1.1-dummy-HAZA.wad" "temp\__channel">nul

// move /y "temp\__channel\0001000248414141.cert" "temp\__channel\0001000048415A41.cert">nul
// move /y "temp\__channel\0001000248414141.footer" "temp\__channel\0001000048415A41.footer">nul
// move /y "temp\__channel\0001000248414141.tik" "temp\__channel\0001000048415A41.tik">nul
// move /y "temp\__channel\0001000248414141.tmd" "temp\__channel\0001000048415A41.tmd">nul

// ::change the title ID to HAZA and change title type (full title ID is 0001000048415A41)
// ::support\sfk replace -binary /0001000248414141/0001000048415A41/ -dir "temp\__channel" -yes>nul
// support\sfk replace "temp\__channel\0001000048415A41.tik" -binary /0001000248414141/0001000048415A41/ -yes>nul
// support\sfk replace "temp\__channel\0001000048415A41.tmd" -binary /0001000248414141/0001000048415A41/ -yes>nul

// del "temp\Photo-Channel-1.1-dummy-HAZA.wad">nul

// %WiiPy% wad pack --fakesign "temp\__channel" "temp\Photo-Channel-1.1-dummy-HAZA.wad"

// if exist "temp\__channel" rd /s /q "temp\__channel"> nul
	
}