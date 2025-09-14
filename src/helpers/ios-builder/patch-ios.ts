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
    
    // Download base WAD if not already done
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

    const tmpPatchingPath = `/tmp/patching-tmp-${entry.wadname}`; // Temporary directory for unpacking and patching

    // Wad unpacking
    const unpackArgs = `wad unpack ${baseWadPath} -o ${tmpPatchingPath}`;
    await runWiiPyCommand(unpackArgs, entry.wadname)

    // Diff Patching Process
    // Note: The original batch script uses several external tools (sfk, jptch, hexalter) for patching.


    // ### 4. Diff Patching Process
    // ```batch
    // # Rename original files to preserve them before patching
    // if exist support\Diffs\%diffpath%\%diffpath%_00.diff ren temp\%basecios%\00000000.app 00000000-original.app
    // if exist support\Diffs\%diffpath%\%diffpath%_01.diff ren temp\%basecios%\00000001.app 00000001-original.app
    // if exist support\Diffs\%diffpath%\%diffpath%_02.diff ren temp\%basecios%\00000002.app 00000002-original.app
    // if exist support\Diffs\%diffpath%\%diffpath%_%lastbasemodule%.diff ren temp\%basecios%\%lastbasemodule%.app %lastbasemodule%-original.app

    // # Apply binary patches using jptch (Japanese patch tool)
    // if exist support\Diffs\%diffpath%\%diffpath%_00.diff support\jptch temp\%basecios%\00000000-original.app support\Diffs\%diffpath%\%diffpath%_00.diff temp\%basecios%\00000000.app
    // if exist support\Diffs\%diffpath%\%diffpath%_01.diff support\jptch temp\%basecios%\00000001-original.app support\Diffs\%diffpath%\%diffpath%_01.diff temp\%basecios%\00000001.app
    // if exist support\Diffs\%diffpath%\%diffpath%_02.diff support\jptch temp\%basecios%\00000002-original.app support\Diffs\%diffpath%\%diffpath%_02.diff temp\%basecios%\00000002.app
    // if exist support\Diffs\%diffpath%\%diffpath%_%lastbasemodule%.diff support\jptch temp\%basecios%\%lastbasemodule%-original.app support\Diffs\%diffpath%\%diffpath%_%lastbasemodule%.diff temp\%basecios%\%lastbasemodule%.app

    // # Patch TMD (Title Metadata) file
    // if exist support\Diffs\%diffpath%\%diffpath%_tmd.diff support\jptch temp\%basecios%\00000001%code2%.tmd support\Diffs\%diffpath%\%diffpath%_tmd.diff temp\%basecios%\00000001%code2new%.tmd

    // # Patch TIK (Ticket) file if needed
    // if exist support\Diffs\%diffpath%\%diffpath%_tik.diff support\jptch temp\%basecios%\00000001%code2%.tik support\Diffs\%diffpath%\%diffpath%_tik.diff temp\%basecios%\00000001%code2new%.tik
    // ```

    // ### 5. Korean Key Patching (if applicable)
    // ```batch
    // # Apply Korean common key support patches to the last base module (0000000e.app)
    // echo Patching %lastbasemodule%.app to support the Korean Common Key

    // # Different patch offsets based on base IOS version
    // # For IOS60-64-v6174 base:
    // if /i "%basewad%" EQU "IOS60-64-v6174" support\hexalter.exe temp\%basecios%\%lastbasemodule%.app [OFFSET]=0xE0
    // if /i "%basewad%" EQU "IOS60-64-v6174" support\hexalter.exe temp\%basecios%\%lastbasemodule%.app [OFFSET]=0x63,0xB8,0x2B,0xB4,0xF4,0x61,0x4E,0x2E,0x13,0xF2,0xFE,0xFB,0xBA,0x4C,0x9B,0x7E
    // ```

    // Wad repacking
    const repackArgs = `wad pack --fakesign ${tmpPatchingPath} ${tmpOutputPath}`;
    await runWiiPyCommand(repackArgs, entry.wadname);""

    // IOS patching
    // const args = `iospatch -fs -ei -na -vd -s ${entry.ciosslot} -v ${entry.ciosversion} ${baseWadPath} -o ${tmpOutputPath}`;
    const args = `iospatch -s ${entry.ciosslot} -v ${entry.ciosversion} ${baseWadPath} -o ${tmpOutputPath}`;

    return await runWiiPyCommand(args, entry.wadname, true).then(() => {
        return copyFileSync(tmpOutputPath, outputPath);
    });
}