import fs from 'fs';
import path from 'path';

export type DatabaseEntry = {
	wadname: string;
	md5: string;
	code1: string;
	code2: string;
	category?: string;
	version: number;
	ciosslot?: string;
	ciosversion?: string;
	basewad?: string;
};

export function getEntry(entry: string): DatabaseEntry | null {
	const dbPath = path.resolve(process.cwd(), 'public/database/database.json');

	const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
	return data.entries[entry] || null;
}
