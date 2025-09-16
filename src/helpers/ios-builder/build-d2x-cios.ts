import { CustomError } from "@/types/custom-error";
import { DatabaseEntry } from "@/types/database";
import { nusDownload, runWiiPyCommand } from "../wiipy-wrapper";
import { verifyFile } from "../download-manager";
import fs from 'fs';

const MODMII_PATH = process.env.MODMII_PATH || '/modmii';

export async function buildD2xCios(entry: DatabaseEntry, outputPath: string) {
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

    return runWiiPyCommand(args, entry.wadname, true);
}
