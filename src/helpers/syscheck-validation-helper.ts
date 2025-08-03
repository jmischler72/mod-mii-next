export function translateKeywordsToEnglish(csvContent: string): string {
    // This function is used to translate keywords in the CSV content so we can extract the system information
    
    const replacements: [string, string][] = [
        ['Chaine Homebrew', 'Homebrew Channel'],
        ['Chaine Channel', 'Homebrew Channel'],
        ['Canale Homebrew', 'Homebrew Channel'],
        ['Canal Homebrew', 'Homebrew Channel'],
        ['Homebrewkanal', 'Homebrew Channel'],

        ['utilise', 'running on'],
        ["appoggiato all'", 'running on '],
        ['ejecutandose en', 'running on'],
        ['benutzt', 'running on'],

        ['Systemmenue', 'System Menu'],
        ['Menu Systeme', 'System Menu'],
        ['Menu di sistema', 'System Menu'],
        ['Menu de Sistema', 'System Menu'],

        ['Pas de patches', 'No Patches'],
        ['Non patchato', 'No Patches'],
        ['Sin Parches', 'No Patches'],
        ['Keine Patches', 'No Patches'],

        ['Bug Trucha', 'Trucha Bug'],

        ['Acces NAND', 'NAND Access'],
        ['Accesso NAND', 'NAND Access'],
        ['Acceso NAND', 'NAND Access'],
        ['NAND Zugriff', 'NAND Access'],

        ['Identificazione ES', 'ES Identify'],

        ['Type de Console', 'Console Type'],
        ['Tipo Console', 'Console Type'],
        ['Tipo de consola', 'Console Type'],
        ['Konsolentyp', 'Console Type'],

        ['Regione', 'Region'],

        ['original region', 'originally'],
        ["region d'origine", 'originally'],
        ['regione originale', 'originally'],
        ['region de origen', 'originally'],
    ];

    for (const [pattern, replacement] of replacements) {
        csvContent = csvContent.replaceAll(pattern, replacement);
    }

    return csvContent;
}

export function validateSyscheckData(data: string): boolean {
    const validSyscheckVersions = [
        'SysCheck HDE',
        'SysCheck ME',
        'sysCheck v2.1.0b',
    ];

    if (validSyscheckVersions.some(version => data.includes(version))) {
        return true;
    }

    return false;
}

export function validateConsoleType(consoleType: string): boolean {
    const validConsoleTypes = ["Wii", "vWii"];

    return validConsoleTypes.includes(consoleType);
}

export function checkPatchedVIOS80(data: string): boolean {
    // Checks for lines starting with "vIOS80 (rev <number>):" and containing "NAND Access"
    const regex = /^vIOS80 \(rev \d+\):.*NAND Access/m;
    return regex.test(data);
}

export function checkD2XCios(data: string, consoleType: string): string[] {
    // Checks for d2x cIOS installations in vIOS248[38], vIOS249[56], vIOS250[57], vIOS251[58]
    let patterns: RegExp[] = [];

    if (consoleType === "Wii") {
        patterns = [
            /^IOS248\[38\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m,
            /^IOS249\[56\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m,
            /^IOS250\[57\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m,
            /^IOS251\[58\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m
        ];
    } else if (consoleType === "vWii") {
        patterns = [
            /^vIOS248\[38\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m,
            /^vIOS249\[56\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m,
            /^vIOS250\[57\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m,
            /^vIOS251\[58\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m,
        ];
    }

    const matchedLines: string[] = [];
    for (const pattern of patterns) {
        console.log("Checking pattern:", pattern);
        const match = data.match(pattern);

        if (match) {
            // Extract the d2x version from the matched line
            const line = match[0];
            const d2xVersionMatch = line.match(/d2x-v(\d+(\.\d+)?)/);

            if (d2xVersionMatch) {
                matchedLines.push(line);
            }
        }
    }
    return matchedLines;
}

export function checkIfHBCIsOutdated(hbcVersion: string, consoleType: string): boolean {
  const requiredVersion = consoleType === "Wii" ? "1.1.2" : "1.1.3";
  const isGreater = hbcVersion.split('.').map(Number)
  .reduce((acc, num, idx) => acc || num >= Number(requiredVersion.split('.')[idx]), false);

  if (isGreater) {
    return false;
  }
  return true;
}

export function checkIfBootMiiInstalled(data: string): boolean {
    return data.includes('BootMii');
}

export function checkIfPriiloaderInstalled(data: string): boolean {
    return data.includes('Priiloader');
}

