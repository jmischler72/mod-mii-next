import { latestd2xVersion } from "@/types/cios-consts";

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

    const cIOSChecks = [
        { ios: 'cIOS248[38]-d2x-v10-beta52', pattern: /^IOS248\[38\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m },
        { ios: 'cIOS249[56]-d2x-v10-beta52', pattern: /^IOS249\[56\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m },
        { ios: 'cIOS250[57]-d2x-v10-beta52', pattern: /^IOS250\[57\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m },
        { ios: 'cIOS251[58]-d2x-v10-beta52', pattern: /^IOS251\[58\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m },

    ];

    const vIOSChecks = [
        { ios: 'vIOS248[38]-d2x-v10-beta52', pattern: /^vIOS248\[38\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m },
        { ios: 'vIOS249[56]-d2x-v10-beta52', pattern: /^vIOS249\[56\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m },
        { ios: 'vIOS250[57]-d2x-v10-beta52', pattern: /^vIOS250\[57\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m },
        { ios: 'vIOS251[58]-d2x-v10-beta52', pattern: /^vIOS251\[58\] \(rev \d+, Info:\s*d2x-v[^\)]*\)/m }
    ];

    const checks = consoleType === "Wii" ? cIOSChecks : vIOSChecks;

    const missingIOS: string[] = [];

    // Check all standard cIOS
    for (const check of checks) {
        const match = data.match(check.pattern);
        if (!match) {
            missingIOS.push(check.ios);
        } else {
            // Extract version after d2x-v and check if it's the latest
            const versionMatch = match[0].match(/d2x-v([^)]*)/);
            if (!versionMatch) break;

            const installedVersion = versionMatch[1];
            if (installedVersion !== latestd2xVersion) {
                console.warn(`cIOS ${check.ios} is outdated: installed v${installedVersion}, expected v${latestd2xVersion}`);
                missingIOS.push(check.ios);
            }
        }
    }
    return missingIOS;
}

export function checkForMissingIOS(data: string, region: string) {
    const activeIOSChecks = [
        { ios: 'IOS9', pattern: /^IOS9 \(rev 1034\): No Patches$/m },
        { ios: 'IOS12', pattern: /^IOS12 \(rev 526\): No Patches$/m },
        { ios: 'IOS13', pattern: /^IOS13 \(rev 1032\): No Patches$/m },
        { ios: 'IOS14', pattern: /^IOS14 \(rev 1032\): No Patches$/m },
        { ios: 'IOS15', pattern: /^IOS15 \(rev 1032\): No Patches$/m },
        { ios: 'IOS17', pattern: /^IOS17 \(rev 1032\): No Patches$/m },
        { ios: 'IOS21', pattern: /^IOS21 \(rev 1039\): No Patches$/m },
        { ios: 'IOS22', pattern: /^IOS22 \(rev 1294\): No Patches$/m },
        { ios: 'IOS28', pattern: /^IOS28 \(rev 1807\): No Patches$/m },
        { ios: 'IOS31', pattern: /^IOS31 \(rev 3608\): No Patches$/m },
        { ios: 'IOS33', pattern: /^IOS33 \(rev 3608\): No Patches$/m },
        { ios: 'IOS34', pattern: /^IOS34 \(rev 3608\): No Patches$/m },
        { ios: 'IOS35', pattern: /^IOS35 \(rev 3608\): No Patches$/m },
        { ios: 'IOS36', pattern: /^IOS36 \(rev 3608\): No Patches$/m },
        { ios: 'IOS37', pattern: /^IOS37 \(rev 5663\): No Patches$/m },
        { ios: 'IOS38', pattern: /^IOS38 \(rev 4124\): No Patches$/m },
        { ios: 'IOS41', pattern: /^IOS41 \(rev 3607\): No Patches$/m },
        { ios: 'IOS43', pattern: /^IOS43 \(rev 3607\): No Patches$/m },
        { ios: 'IOS45', pattern: /^IOS45 \(rev 3607\): No Patches$/m },
        { ios: 'IOS46', pattern: /^IOS46 \(rev 3607\): No Patches$/m },
        { ios: 'IOS48', pattern: /^IOS48 \(rev 4124\): No Patches$/m },
        { ios: 'IOS53', pattern: /^IOS53 \(rev 5663\): No Patches$/m },
        { ios: 'IOS55', pattern: /^IOS55 \(rev 5663\): No Patches$/m },
        { ios: 'IOS56', pattern: /^IOS56 \(rev 5662\): No Patches$/m },
        { ios: 'IOS57', pattern: /^IOS57 \(rev 5919\): No Patches$/m },
        { ios: 'IOS61', pattern: /^IOS61 \(rev 5662\): No Patches$/m },
        { ios: 'IOS62', pattern: /^IOS62 \(rev 6430\): No Patches$/m }
    ];

    const missingIOS: string[] = [];

    // Check for IOS58 with special conditions
    const ios58Present = /^IOS58 \(rev 6176\): No Patches$/m.test(data) || 
                        /^IOS58 \(rev 6176\): USB 2\.0$/m.test(data);
    
    if (!ios58Present) {
        missingIOS.push('IOS58');
    }

    // Check BC
    const bcPresent = /^BC v6$/m.test(data);
    if (!bcPresent) {
        missingIOS.push('BC');
    }

    // Check for IOS59 with region-specific logic
    if (region.toUpperCase() === "J") {
        const ios59Present = /^IOS59 \(rev 9249\): No Patches$/m.test(data);
        if (!ios59Present) {
            missingIOS.push('IOS59');
        }
    }

    // Check all standard IOS
    for (const check of activeIOSChecks) {
        if (!check.pattern.test(data)) {
            missingIOS.push(check.ios);
        }
    }

    return missingIOS;
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

