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

export const d2xBundled= "11-beta3";


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

export function validateConsoleType(data: string): boolean {
    const validConsoleTypes = ['Wii', 'vWii'];
    if( data.includes('Console Type')) {
        const consoleTypeLine = data.split('\n').find(line => line.includes('Console Type'));
        if (consoleTypeLine) {
            const consoleType = consoleTypeLine.split(':')[1].trim();
            return validConsoleTypes.includes(consoleType);
        }
    }
    return false;
}