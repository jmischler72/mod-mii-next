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

const dbPath = path.resolve(process.cwd(), 'public/database/database.json');
const database = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

export function getDatabaseEntry(entry: string): DatabaseEntry | null {
	const entryData = database.entries[entry] || null;

	// if wadname has no extension, add .wad
	if (entryData && path.extname(entryData.wadname) === '') {
		entryData.wadname += '.wad';
	}
	return entryData;
}

export function getDatabaseEntryFromWadname(wadname: string): DatabaseEntry | null {
	if (!wadname.endsWith('.wad')) {
		wadname += '.wad';
	}
	const entryData =
		(Object.values(database.entries) as DatabaseEntry[]).find((entry: DatabaseEntry) => entry.wadname === wadname) ||
		null;

	return entryData;
}
