import { CustomError } from "@/types/custom-error";

export function getConsoleRegion(data: string): string | null {
    const regionMap: Record<string, string> = {
        'NTSC-U': 'U',
        'PAL': 'E',
        'JAP': 'J',
        'NTSC-J': 'J',
        'KOR': 'K',
    };

    const regionLine = data.split('\n').find(line => line.trim().toLowerCase().startsWith('region:'));
    if (!regionLine) return null;

    for (const [key, value] of Object.entries(regionMap)) {
        if (regionLine.toUpperCase().includes(key)) {
            return value;
        }
    }

    return null;
}

export function getHBCVersion(data: string): string | null {
    const hbcLine = data.split('\n').find(line => line.includes('Homebrew Channel'));
    if (!hbcLine) return null;

    const match = hbcLine.match(/Homebrew Channel\s+([0-9.]+)/);
    return match ? match[1] : null;
}

export function getSystemMenuVersion(data: string): string | null {
    const systemMenuLine = data.split('\n').find(line => line.includes('System Menu'));
    if (!systemMenuLine) return null;

    // Remove "System Menu " prefix, leading/trailing spaces, and any commas
    const version = systemMenuLine.replace(/^.*System Menu\s*/, '').replace(/^\s*|\s*$/g, '').replace(/,/g, '');
    return version || null;
}

export function getFirmware(systemMenuVersion: string): { firmware: string, firmwareVersion: number, SMregion: string } | null {

    let firmstart = systemMenuVersion.replace(/\(.*?\)/g, '').trim();
    const firmend = systemMenuVersion.match(/\((.*?)\)/);
    const firmendParsed = firmend ? parseInt(firmend[1].replace(/^v/, '')) : 0;

    const SMregion = firmstart.slice(-1);
    firmstart = firmstart.slice(0, -1);

    if (firmstart.startsWith('3')) {
        firmstart = '3.X';
    } else if (firmstart.startsWith('2') || firmstart.startsWith('1')) {
        firmstart = 'o';
    }

    return { firmware: firmstart, firmwareVersion: firmendParsed, SMregion };
}


export function getLatestSMVersion(data: { firmware: string, firmwareVersion: number}): string {

    if(data.firmwareVersion === 4609 || data.firmwareVersion === 4610) {
        throw new CustomError(`This SysCheck is for a Wii Mini and is not currently supported, aborting analysis`);
    }

    if (data.firmwareVersion > 518) { // check if firmware version is a cSM (custom System Menu)
        if (["4.2", "4.1"].includes(data.firmware)) {
            return data.firmware;
        }
        return "4.3";
    }

    if (data.firmware === "4.0" || data.firmware === "3.X" || data.firmware === "o") {
        return "4.3";
    } else {
        return data.firmware;
    }
}

export function getConsoleType(data: string): string | null {
    const consoleTypeLine = data.split('\n').find(line => line.includes('Console Type'));
    if (!consoleTypeLine) return null;

    const consoleType = consoleTypeLine.split(':')[1].trim();
    return consoleType;
}