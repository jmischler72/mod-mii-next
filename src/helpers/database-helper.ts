import fs from 'fs';
import path from 'path';

export type DatabaseEntry = {
	wadname: string;
	md5: string;
	md5alt?: string;
	code1: string;
	code2: string;
	category?: string;
	version: number;
	// cIOS or patchios
	ciosslot?: string;
	ciosversion?: string;
	basewad?: string;
	md5base?: string;
	md5basealt?: string;
};

export function getDatabaseEntry(entry: string): DatabaseEntry | null {
	const dbPath = path.resolve(process.cwd(), 'public/database/database.json');

	const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
	const entryData = data.entries[entry] || null;

	// if wadname has no extension, add .wad
	if (path.extname(entryData.wadname) === '') {
		entryData.wadname += '.wad';
	}
	return entryData;
}
