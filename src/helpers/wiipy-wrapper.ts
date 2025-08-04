import { CustomError } from "@/types/custom-error";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// function runCommand (
//     command: string,
//     args: string[] = [],
//     options: { cwd?: string } = {}
// ): Promise<string> {
//     return new Promise((resolve, reject) => {
//         const child = spawn(command, args, { ...options, shell: true });

//         let output = '';
//         child.stdout.on('data', (data) => {
//             output += data.toString();
//         });

//         child.stderr.on('data', (data) => {
//             console.error(`Error: ${data}`);
//         });

//         child.on('close', (code) => {
//             if (code === 0) {
//                 resolve(output);
//             } else {
//                 reject(new CustomError(`Command failed with code ${code}`));
//             }
//         });
//     });
// }

// export function runWiiPy(
//     args: string[],
//     options: { cwd?: string } = {}
// ): Promise<string> {
//     return runCommand("python3", ["/WiiPy/wiipy.py", ...args], options);
// }

const wiipyCommand = "python3 /WiiPy/wiipy.py";
const nusCommand = `${wiipyCommand} nus title`;
export const wadsDirectory = path.join(process.cwd(), '.temp-downloads');

export function nusDownload(
    code1: string,
    code2: string,
    version: string,
    wadname: string,
): Promise<string> {
    // Ensure directory exists
    if (!fs.existsSync(wadsDirectory)) {
        fs.mkdirSync(wadsDirectory, { recursive: true });
    }

    // Check if WAD already exists
    const wadPath = path.join(wadsDirectory, wadname);
    if (fs.existsSync(wadPath)) {
        console.log(`WAD ${wadname} already exists in cache`);
        return Promise.resolve(`WAD ${wadname} found in cache`);
    }

    const fullCommand = `${nusCommand} ${code1}${code2} -v ${version} --wad ${wadPath}`;
    const child = spawn(fullCommand, [], { shell: true });

    let output = '';
    
    child.stdout.on('data', (data) => {
        const line = data.toString();
        output += line;
    });

    child.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
    });

    return new Promise((resolve, reject) => {
        child.on('close', (code) => {
            console.log(''); // New line after progress
            if (code === 0) {
                resolve(output);
            } else {
                reject(new CustomError(`Command failed with code ${code}`));
            }
        });
    });
}

export function getCurrentWadsInDirectory(): string[] {
    const directoryPath = path.resolve(wadsDirectory);
    if (!fs.existsSync(directoryPath)) {
        return [];
    }

    return fs.readdirSync(directoryPath).filter((file) => file.endsWith('.wad'));
}