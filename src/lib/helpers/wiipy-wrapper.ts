import { CustomError } from "@/types/custom-error";
import { spawn } from "child_process";

function runCommand (
    command: string,
    args: string[] = [],
    options: { cwd?: string } = {}
): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { ...options, shell: true });

        let output = '';
        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            console.error(`Error: ${data}`);
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new CustomError(`Command failed with code ${code}`));
            }
        });
    });
}

export function runWiiPy(
    args: string[],
    options: { cwd?: string } = {}
): Promise<string> {
    return runCommand("python3", ["/WiiPy/wiipy.py", ...args], options);
}