import { EnglishKeywords } from "./english-keywords";

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

