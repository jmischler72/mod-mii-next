import { copyFileSync } from "fs";
import { nusDownload, runWiiPyCommand } from "../wiipy-wrapper";
import { getDatabaseEntryFromWadname } from "../database-helper";
import { verifyFile } from "../download-manager";
import { CustomError } from "@/types/custom-error";
import fs from 'fs';
import { DatabaseEntry } from "@/types/database";

export async function patchIos(entry: DatabaseEntry, outputPath: string) {
    if (!entry.ciosslot || !entry.ciosversion) {
        throw new CustomError(`Missing cIOS slot or version for ${entry.wadname}`);
    }
    
    const baseWadPath = `/tmp/${entry.basewad}.wad`;
    const baseEntry = getDatabaseEntryFromWadname(entry.basewad!);
    if (!baseEntry) throw new Error(`Base WAD entry not found: ${entry.basewad}`);
    await nusDownload(baseEntry, baseWadPath);
    await verifyFile(baseWadPath, entry.md5base!, entry.md5basealt);

    console.log("Base WAD verified, path: " + baseWadPath); // Debugging line

    if (!fs.existsSync(baseWadPath)) {
        throw new CustomError(`Base WAD file not found: ${baseWadPath}`);
    }

  	const tmpOutputPath = `${outputPath}`.replace('(', '').replace(')', ''); // wiipy does not like parentheses in file paths

	const args = `iospatch -fs -ei -na -vd -s ${entry.ciosslot} -v ${entry.ciosversion} ${baseWadPath} -o ${tmpOutputPath}`;

	return await runWiiPyCommand(args, entry.wadname, true).then(() => {
		return copyFileSync(tmpOutputPath, outputPath);
	});
}