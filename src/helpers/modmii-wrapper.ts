import { spawn } from 'child_process';

const MODMII_PATH = process.env.MODMII_PATH || '/modmii';

const modmiiCommand = `${MODMII_PATH}/Support/ModMii.bat`;

const wineShell = 'wine';
const killWine = 'wineserver -k';

export async function runCommand(args: string, outputStr?: string, debug: boolean = false): Promise<string> {
	return new Promise((resolve, reject) => {
		const callerId = outputStr || args.split(' ')[0];

		const child = spawn(wineShell, [modmiiCommand, ...args.split(' ')]);
		// Timeout logic
		const timeoutMs = 60000; // 1 minute
		// const debugTimeoutMs = 10000; // 10 seconds
		const timeout = setTimeout(() => {
			spawn(killWine, { shell: true });
			reject(new Error(`[${callerId}] Command timed out after ${timeoutMs / 1000} seconds`));
		}, timeoutMs);

		child.stdout.on('data', (data) => {
			const output = data.toString();
			output
				.split('\n')
				.filter((line: string) => line.trim() !== '')
				.forEach((line: string) => console.log(`[${callerId}] Out: ${line}`));

			// Detect prompt and send newline to stdin
			if (output.includes('Hit any key to use ModMii anyway')) {
				child.stdin.write('\n');
				if (debug) {
					console.log(`[${callerId}] Sent newline to continue ModMii execution.`);
				}
			}
		});

		child.stderr.on('data', (data) => {
			data
				.toString()
				.split('\n')
				.filter((line: string) => line.trim() !== '')
				.forEach((line: string) => console.error(`[${callerId}] Err: ${line}`));
		});

		child.on('close', (code) => {
			clearTimeout(timeout);
			if (code === 0) {
				resolve(`[${callerId}] Command "${modmiiCommand} ${args}" executed successfully`);
			} else {
				reject(new Error(`[${callerId}] Command "${modmiiCommand} ${args}" failed with code ${code}`));
			}
		});
	});
}

export async function runCommandWithOutput(
	args: string,
	outputStr?: string,
	debug: boolean = false,
): Promise<{ output: string; err: string }> {
	return new Promise((resolve) => {
		const callerId = outputStr || args.split(' ')[0];
		let output = '';
		let err = '';
		const child = spawn(wineShell, [modmiiCommand, ...args.split(' ')]);
		const timeoutMs = 10000; // 10 seconds
		const timeout = setTimeout(() => {
			spawn(killWine, { shell: true });
			err += `[${callerId}] Command timed out after ${timeoutMs / 1000} seconds\n`;
			resolve({ output, err });
		}, timeoutMs);
		child.stdout.on('data', (data) => {
			const outStr = data.toString();
			output += outStr;
			if (outStr.includes('Hit any key to use ModMii anyway')) {
				child.stdin.write('\n');
				if (debug) {
					output += `[${callerId}] Sent newline to continue ModMii execution.\n`;
				}
			}
		});
		child.stderr.on('data', (data) => {
			err += data.toString();
		});
		child.on('close', () => {
			clearTimeout(timeout);
			resolve({ output, err });
		});

		child.stdout.on('data', (data) => {
			const output = data.toString();
			output
				.split('\n')
				.filter((line: string) => line.trim() !== '')
				.forEach((line: string) => console.log(`[${callerId}] Out: ${line}`));

			// Detect prompt and send newline to stdin
			if (output.includes('Hit any key to use ModMii anyway')) {
				child.stdin.write('\n');
				if (debug) {
					console.log(`[${callerId}] Sent newline to continue ModMii execution.`);
				}
			}
		});

		child.stderr.on('data', (data) => {
			data
				.toString()
				.split('\n')
				.filter((line: string) => line.trim() !== '')
				.forEach((line: string) => console.error(`[${callerId}] Err: ${line}`));
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
	return runCommandWithOutput(args);
}
