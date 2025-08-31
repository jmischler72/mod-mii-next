const { spawn } = require('child_process');

const MODMII_PATH = process.env.MODMII_PATH || '/modmii';
const modmiiCommand = `${MODMII_PATH}/Support/ModMii.bat`;
const wineShell = 'wine';
const killWine = 'wineserver -k';

async function runCommand(args, outputStr = undefined, debug = false) {
    return new Promise((resolve, reject) => {
        const callerId = outputStr || args.split(' ')[0];
        const child = spawn(wineShell, [modmiiCommand, ...args.split(' ')]);
        const timeoutMs = 60000; // 1 minute
        const timeout = setTimeout(() => {
            spawn(killWine, { shell: true });
            reject(new Error(`[${callerId}] Command timed out after ${timeoutMs / 1000} seconds`));
        }, timeoutMs);
        child.stdout.on('data', (data) => {
            const output = data.toString();
            output.split('\n').filter(line => line.trim() !== '').forEach(line => console.log(`[${callerId}] Out: ${line}`));
            if (output.includes('Hit any key to use ModMii anyway')) {
                child.stdin.write('\n');
                if (debug) {
                    console.log(`[${callerId}] Sent newline to continue ModMii execution.`);
                }
            }
        });
        child.stderr.on('data', (data) => {
            data.toString().split('\n').filter(line => line.trim() !== '').forEach(line => console.error(`[${callerId}] Err: ${line}`));
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

async function runCommandWithOutput(args, outputStr = undefined, debug = false) {
    return new Promise((resolve) => {
        const callerId = outputStr || args.split(' ')[0];
        let output = '';
        let err = '';
        let finished = false;
        let exitCode = null;
        const child = spawn(wineShell, [modmiiCommand, ...args.split(' ')]);
        const timeoutMs = 10000; // 10 seconds
        const timeout = setTimeout(() => {
            spawn(killWine, { shell: true });
            err += `[${callerId}] Command timed out after ${timeoutMs / 1000} seconds\n`;
            finished = true;
            resolve({ output, err, exitCode: 'timeout' });
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
        child.on('error', (error) => {
            clearTimeout(timeout);
            finished = true;
            err += `[${callerId}] Spawn error: ${error.message}\n`;
            resolve({ output, err, exitCode: 'spawn_error' });
        });
        child.on('close', (code) => {
            if (!finished) {
                clearTimeout(timeout);
                exitCode = code;
                if (code !== 0) {
                    err += `[${callerId}] Command failed with code ${code}\n`;
                }
                resolve({ output, err, exitCode });
            }
        });
        child.stdout.on('data', (data) => {
            const outputStr = data.toString();
            outputStr.split('\n').filter(line => line.trim() !== '').forEach(line => console.log(`[${callerId}] Out: ${line}`));
            if (outputStr.includes('Hit any key to use ModMii anyway')) {
                child.stdin.write('\n');
                if (debug) {
                    console.log(`[${callerId}] Sent newline to continue ModMii execution.`);
                }
            }
        });
        child.stderr.on('data', (data) => {
            data.toString().split('\n').filter(line => line.trim() !== '').forEach(line => console.error(`[${callerId}] Err: ${line}`));
        });
    });
}

async function syscheckAnalysis() {
    const args = `-h`;
    return runCommandWithOutput(args);
}

module.exports = {
    runCommand,
    runCommandWithOutput,
    syscheckAnalysis
};
