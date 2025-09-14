import { getDatabaseEntry } from "../database-helper";
import { CustomError } from "@/types/custom-error";
import { nusDownload, runWiiPyCommand } from "../wiipy-wrapper";
import { verifyFile } from "../download-manager";
import fs from 'fs';
import { copyFileSync } from "fs";

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

	// Download base Photo Channel 1.0 WAD
	const baseEntry = getDatabaseEntry('PHOTO0');
	if (!baseEntry) throw new CustomError('Photo Channel 1.0 entry not found in database');
	
	const baseWadPath = `/tmp/${baseEntry.wadname}`;
	await nusDownload(baseEntry, baseWadPath);
	await verifyFile(baseWadPath, baseEntry.md5, baseEntry.md5alt);

	if (!fs.existsSync(baseWadPath)) {
		throw new CustomError(`Base WAD file not found: ${baseWadPath}`);
	}

	const tempWadPath = `/tmp/Photo-Channel-1.1-dummy-HAZA.wad`;
	const tempChannelDir = `/tmp/__channel`;

	// Copy base WAD to temp location
	copyFileSync(baseWadPath, tempWadPath);

	// Change boot index to 0 (at offset 0xEE0 of WAD)
	await setBytesInFile(tempWadPath, 0xEE0, Buffer.from([0x00, 0x00]));

	// Remove content modules 1, 2, 3 (keep only content 0 - the banner)
	const removeContent3Args = `wad remove -i 3 "${tempWadPath}"`;
	const removeContent2Args = `wad remove -i 2 "${tempWadPath}"`;
	const removeContent1Args = `wad remove -i 1 "${tempWadPath}"`;
	
	await runWiiPyCommand(removeContent3Args, entry.wadname);
	await runWiiPyCommand(removeContent2Args, entry.wadname);
	await runWiiPyCommand(removeContent1Args, entry.wadname);


	// Clean up any existing temp directory
	if (fs.existsSync(tempChannelDir)) {
		fs.rmSync(tempChannelDir, { recursive: true, force: true });
	}
	fs.mkdirSync(tempChannelDir, { recursive: true });

	// Unpack WAD to temp directory
	const unpackArgs = `wad unpack --skip-hash "${tempWadPath}" "${tempChannelDir}"`;
	await runWiiPyCommand(unpackArgs, entry.wadname);

	// Rename files to change title ID from HAGA (0001000248414141) to HAZA (0001000048415A41)
	const oldTitleId = '0001000248414141';
	const newTitleId = '0001000048415A41';
	
	const filesToRename = ['cert', 'footer', 'tik', 'tmd'];
	for (const ext of filesToRename) {
		const oldPath = `${tempChannelDir}/${oldTitleId}.${ext}`;
		const newPath = `${tempChannelDir}/${newTitleId}.${ext}`;
		if (fs.existsSync(oldPath)) {
			fs.renameSync(oldPath, newPath);
		}
	}

	// Apply binary patches to change title ID in ticket and TMD files
	const tikFile = `${tempChannelDir}/${newTitleId}.tik`;
	const tmdFile = `${tempChannelDir}/${newTitleId}.tmd`;
	
	if (fs.existsSync(tikFile)) {
		await patchBinaryFile(tikFile, Buffer.from('0001000248414141', 'hex'), Buffer.from('0001000048415A41', 'hex'));
	}
	
	if (fs.existsSync(tmdFile)) {
		await patchBinaryFile(tmdFile, Buffer.from('0001000248414141', 'hex'), Buffer.from('0001000048415A41', 'hex'));
	}

	// Remove the temporary WAD file
	if (fs.existsSync(tempWadPath)) {
		fs.unlinkSync(tempWadPath);
	}

	// Repack WAD with fakesign
	const repackArgs = `wad pack --fakesign "${tempChannelDir}" "${tempWadPath}"`;
	await runWiiPyCommand(repackArgs, entry.wadname);

	// Copy final WAD to output path
	console.log(`Copying final WAD to output path: ${outputPath}`);
	copyFileSync(tempWadPath, outputPath);

	// Clean up temp files
	if (fs.existsSync(tempChannelDir)) {
		fs.rmSync(tempChannelDir, { recursive: true, force: true });
	}
	if (fs.existsSync(tempWadPath)) {
		fs.unlinkSync(tempWadPath);
	}

	return Promise.resolve(`WAD ${entry.wadname} built successfully`);
}

async function patchBinaryFile(filePath: string, searchPattern: Buffer, replacement: Buffer): Promise<void> {
	const fileBuffer = fs.readFileSync(filePath);
	let modified = false;
	
	// Search for pattern and replace
	let index = 0;
	while ((index = fileBuffer.indexOf(searchPattern, index)) !== -1) {
		replacement.copy(fileBuffer, index);
		index += searchPattern.length;
		modified = true;
	}
	
	if (modified) {
		fs.writeFileSync(filePath, fileBuffer);
	}
}

async function setBytesInFile(filePath: string, offset: number, bytes: Buffer): Promise<void> {
	const fileBuffer = fs.readFileSync(filePath);
	
	// Check if offset is within file bounds
	if (offset + bytes.length > fileBuffer.length) {
		throw new Error(`Offset ${offset} + ${bytes.length} bytes exceeds file size ${fileBuffer.length}`);
	}
	
	// Copy bytes to the specified offset
	bytes.copy(fileBuffer, offset);
	
	// Write the modified buffer back to file
	fs.writeFileSync(filePath, fileBuffer);
}