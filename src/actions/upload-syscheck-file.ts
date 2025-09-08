'use server';

import { CustomError } from '@/types/custom-error';
import { getDatabaseEntry } from '@/helpers/database-helper';
import { uploadFormDataSchema } from '@/schemas/upload-schema';
import { UploadSyscheckResult } from '@/types/upload-syscheck-type';
import { getSyscheckAnalysis } from '@/helpers/syscheck/syscheck-analysis';

export async function uploadSyscheckFile(formData: FormData): Promise<UploadSyscheckResult> {
	try {
		const file = formData.get('file') as File;
		const activeIOSStr = formData.get('activeIOS') as string;
		const extraProtectionStr = formData.get('extraProtection') as string;

		// Validate the form data using the shared schema
		const validationResult = uploadFormDataSchema.safeParse({
			file,
			activeIOS: activeIOSStr,
			extraProtection: extraProtectionStr,
		});

		if (!validationResult.success) {
			throw new CustomError(validationResult.error.issues[0].message);
		}

		const { file: validatedFile, activeIOS, extraProtection } = validationResult.data;
		const cMios = false; // A cMIOS allows older non-chipped Wii's to play GameCube backup discs

		const csvContent = await validatedFile.text();

		if (!csvContent.trim()) {
			throw new CustomError('The CSV file appears to be empty');
		}

		const systemInfos = getSyscheckAnalysis(csvContent, { activeIOS, extraProtection, cMios });

		const wadsInfos = systemInfos.wadToInstall.map((wadId) => {
			return { wadname: getDatabaseEntry(wadId)?.wadname || 'Unknown', wadId };
		});

		return {
			success: true,
			message: `CSV file "${validatedFile.name}" uploaded successfully`,
			data: {
				filename: validatedFile.name,
				size: validatedFile.size,
				region: systemInfos.region || 'Unknown',
				hbcVersion: systemInfos.hbcVersion || 'Unknown',
				systemMenuVersion: systemInfos.systemMenuVersion || 'Unknown',
				firmware: systemInfos.firmware,
				consoleType: systemInfos.consoleType,
				systemChecks: systemInfos.systemChecks,
				wadsInfos: wadsInfos || [],
			},
		};
	} catch (error) {
		console.error('Error processing CSV file:', error);
		return {
			success: false,
			error: error instanceof CustomError ? error.message : 'An error occurred while processing the syscheck file',
		};
	}
}
