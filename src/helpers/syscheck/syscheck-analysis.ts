
import {
    checkD2XCios,
    checkExtraProtection,
    checkForMissingIOS,
    checkIfBootMiiInstalled,
    checkIfHBCIsOutdated,
    checkIfPriiloaderInstalled,
    translateKeywordsToEnglish,
    validateConsoleType,
    validateSyscheckData,
} from '@/helpers/syscheck/validation-helper';
import {
    getConsoleRegion,
    getConsoleType,
    getFirmware,
    getHBCVersion,
    getLatestSMVersion,
    getRegionShortCode,
    getSystemMenuVersion,
} from '@/helpers/syscheck/info-helper';
import { CustomError } from '@/types/custom-error';

export function getSyscheckAnalysis(
	data: string,
	options: { activeIOS?: boolean; extraProtection?: boolean; cMios?: boolean },
) {
    data = translateKeywordsToEnglish(data);

    if (!validateSyscheckData(data)) {
        throw new CustomError('The CSV file is not a valid SysCheck report');
    }

	const region = getConsoleRegion(data);
	const hbcVersion = getHBCVersion(data);
	const systemMenuVersion = getSystemMenuVersion(data);
	const firmware = systemMenuVersion && getFirmware(systemMenuVersion);
	const consoleType = getConsoleType(data);

	if (!region || !systemMenuVersion || !firmware) {
		throw new CustomError('Could not extract necessary information from the CSV file');
	}

	if (!consoleType || !validateConsoleType(consoleType)) {
		throw new CustomError('The CSV file does not contain a valid console type');
	}

	const regionShortCode = getRegionShortCode(region);
	if (firmware.SMregion !== regionShortCode) {
		throw new CustomError(
			`The firmware region "${firmware.SMregion}" does not match the console region "${regionShortCode}"`,
		);
	}

	const wadToInstall = [];

	// Check system components
	const isBootMiiInstalled = checkIfBootMiiInstalled(data);
	const isPriiloaderInstalled = checkIfPriiloaderInstalled(data);
	const isHbcOutdated = hbcVersion ? checkIfHBCIsOutdated(hbcVersion, consoleType) : false;
	const outdatedD2XCios = checkD2XCios(data, consoleType);
	const missingIOS = options.activeIOS ? checkForMissingIOS(data, region, consoleType) : [];
	const needsExtraProtection = options.extraProtection ? checkExtraProtection(data) : [];

	if (!isBootMiiInstalled) {
		wadToInstall.push('HM');
	} else {
		if (!hbcVersion) {
			wadToInstall.push('OHBC113');
			//also check if IOS58 is installed
			const isIOS58Installed = data.includes('IOS58');
			if (!isIOS58Installed && isBootMiiInstalled) wadToInstall.push('IOS58');
		} else {
			if (isHbcOutdated) wadToInstall.push('OHBC');
		}
	}

	const latestFirmwareVersion = getLatestSMVersion(firmware);
	if (latestFirmwareVersion !== firmware.firmware) wadToInstall.push(`SM${latestFirmwareVersion}${firmware.SMregion}`);

	const updatePriiloader = false;
	if (!isPriiloaderInstalled || (isPriiloaderInstalled && updatePriiloader)) wadToInstall.push('prii');

	wadToInstall.push(...outdatedD2XCios);

	if (options.activeIOS) {
		wadToInstall.push(...missingIOS);
	}

	if (options.extraProtection) {
		wadToInstall.push(...needsExtraProtection);
	}

	if (wadToInstall.length > 0) {
		wadToInstall.push('yawm');
	}

	return {
		region,
		hbcVersion,
		systemMenuVersion,
		firmware: {
			SMregion: firmware.SMregion,
			firmware: firmware.firmware,
			firmwareVersion: firmware.firmwareVersion,
		},
		consoleType,
		systemChecks: {
			isBootMiiInstalled,
			isPriiloaderInstalled,
			isHbcOutdated,
			missingIOS,
			outdatedD2XCios,
			needsExtraProtection,
		},
		wadToInstall,
	};
}
