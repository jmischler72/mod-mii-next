
enum EnglishKeywords {
    HomebrewChannel = 'Homebrew Channel',
    RunningOn = 'running on',
    SystemMenu = 'System Menu',
    NoPatches = 'No Patches',
    TruchaBug = 'Trucha Bug',
    NANDAccess = 'NAND Access',
    ESIdentify = 'ES Identify',
    ConsoleType = 'Console Type',
    Region = 'Region',
    Originally = 'originally',
}



export function translateKeywordsToEnglish(csvContent: string): string {
  // This function can be used to translate keywords in the CSV content if needed
  // For now, it just returns the content as is

    const replacements: [string, string][] = [
        ['Chaine Homebrew', EnglishKeywords.HomebrewChannel],
        ['Chaine Channel', EnglishKeywords.HomebrewChannel],
        ['Canale Homebrew', EnglishKeywords.HomebrewChannel],
        ['Canal Homebrew', EnglishKeywords.HomebrewChannel],
        ['Homebrewkanal', EnglishKeywords.HomebrewChannel],

        ['utilise', EnglishKeywords.RunningOn],
        ["appoggiato all'", EnglishKeywords.RunningOn + ' '],
        ['ejecutandose en', EnglishKeywords.RunningOn],
        ['benutzt', EnglishKeywords.RunningOn],

        ['Systemmenue', EnglishKeywords.SystemMenu],
        ['Menu Systeme', EnglishKeywords.SystemMenu],
        ['Menu di sistema', EnglishKeywords.SystemMenu],
        ['Menu de Sistema', EnglishKeywords.SystemMenu],

        ['Pas de patches', EnglishKeywords.NoPatches],
        ['Non patchato', EnglishKeywords.NoPatches],
        ['Sin Parches', EnglishKeywords.NoPatches],
        ['Keine Patches', EnglishKeywords.NoPatches],

        ['Bug Trucha', EnglishKeywords.TruchaBug],

        ['Acces NAND', EnglishKeywords.NANDAccess],
        ['Accesso NAND', EnglishKeywords.NANDAccess],
        ['Acceso NAND', EnglishKeywords.NANDAccess],
        ['NAND Zugriff', EnglishKeywords.NANDAccess],

        ['Identificazione ES', EnglishKeywords.ESIdentify],

        ['Type de Console', EnglishKeywords.ConsoleType],
        ['Tipo Console', EnglishKeywords.ConsoleType],
        ['Tipo de consola', EnglishKeywords.ConsoleType],
        ['Konsolentyp', EnglishKeywords.ConsoleType],

        ['Regione', EnglishKeywords.Region],

        ['original region', EnglishKeywords.Originally],
        ["region d'origine", EnglishKeywords.Originally],
        ['regione originale', EnglishKeywords.Originally],
        ['region de origen', EnglishKeywords.Originally],
    ];

    for (const [pattern, replacement] of replacements) {
        csvContent = csvContent.replaceAll(pattern, replacement);
    }

    return csvContent;
}

export function validateSyscheckData(data: string): boolean {
    if (data.includes('SysCheck HDE') || data.includes('SysCheck ME') || data.includes('sysCheck v2.1.0b')) {
        return true;
    }

    return false;
}


enum ConsoleType {
    Wii = 'Wii',
    vWii = 'vWii',
}

export function validateConsoleType(data: string): boolean {
    const validConsoleTypes = [ConsoleType.Wii, ConsoleType.vWii];
    if( data.includes('Console Type')) {
        const consoleTypeLine = data.split('\n').find(line => line.includes('Console Type'));
        if (!consoleTypeLine) return false;

        const consoleType = consoleTypeLine.split(':')[1].trim();

        if( consoleType === ConsoleType.vWii ) {

        }

        return validConsoleTypes.includes(consoleType as ConsoleType);
    }
    return false;
}

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
    const hbcLine = data.split('\n').find(line => line.includes(EnglishKeywords.HomebrewChannel));
    if (!hbcLine) return null;

    const match = hbcLine.match(/Homebrew Channel\s+([0-9.]+)/);
    return match ? match[1] : null;
}

export function getSystemMenuVersion(data: string): string | null {
    const systemMenuLine = data.split('\n').find(line => line.includes(EnglishKeywords.SystemMenu));
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


export function getLatestSMVersion(data: { firmware: string, firmwareVersion: number}): { success: boolean, latestVersion?: string, error?: string } {

    if(data.firmwareVersion === 4609 || data.firmwareVersion === 4610) {
        return {
            success: false,
            error: `This SysCheck is for a Wii Mini and is not currently supported, aborting analysis`
        };
    }

    if (data.firmwareVersion > 518) {
        if (["4.2", "4.1"].includes(data.firmware)) {
            return {
                success: true,
                latestVersion: data.firmware,
            };
        }
        return {
            success: true,
            latestVersion: "4.3",
        };
    }


    if (data.firmware === "4.0" || data.firmware === "3.X" || data.firmware === "o") {
        return {
            success: true,
            latestVersion: "4.3",
        };
    } else {
        return {
            success: true,
            latestVersion: data.firmware,
        };
    }
}

export function checkIfPriiloaderInstalled(data: string): boolean {
    return data.includes('Priiloader');
}