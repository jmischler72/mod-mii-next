import fs from 'fs';
import path from 'path';

export function getEntry(entry: string){
    const dbPath = path.resolve(process.cwd(), 'public/database/database.json');

    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    return data.entries[entry] || null;
}