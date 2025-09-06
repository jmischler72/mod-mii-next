import fs from 'fs';
import path from 'path';
import { DatabaseEntry } from '@/types/database';

const dbPath = path.resolve(process.cwd(), 'public/database.json');
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
