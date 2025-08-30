import { CustomError } from '@/types/custom-error';
import { spawn } from 'child_process';

const MODMII_PATH = process.env.MODMII_PATH || '/modmii';

const modmiiCommand = `wine ${MODMII_PATH}/ModMii.exe`;

export async function runCommand(args: string, outputStr?: string, debug: boolean = false): Promise<string> {
	return new Promise((resolve, reject) => {
		const callerId = args.split(' ')[0] + (outputStr ? ` (${outputStr})` : '');

		const child = spawn(modmiiCommand, [args], { shell: true });

		child.stdout.on('data', (data) => {
			data
				.toString()
				.split('\n')
				.filter((line: string) => line.trim() !== '')
				.forEach((line: string) => console.log(`[${callerId}] Out: ${line}`));
		});

		child.stderr.on('data', (data) => {
			data
				.toString()
				.split('\n')
				.filter((line: string) => line.trim() !== '')
				.forEach((line: string) => console.error(`[${callerId}] Err: ${line}`));
		});

		child.on('close', (code) => {
			if (code === 0) {
				resolve(`[${callerId}] Command "${modmiiCommand} ${args}" executed successfully`);
			} else {
				reject(new Error(`[${callerId}] Command "${modmiiCommand} ${args}" failed with code ${code}`));
			}
		});
	});
}

export async function syscheckAnalysis() {
	// if (fs.existsSync(outputPath)) {
	// 	try {
	// 		await verifyFile(outputPath, entry.md5, entry.md5alt);
	// 		return Promise.resolve(`WAD ${entry.wadname} found in cache`);
	// 	} catch (err) {
	// 		console.warn('NUS: Cached file verification failed, re-downloading');
	// 	}
	// }

	const args = `-h`;
	return runCommand(args);
}
