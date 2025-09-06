export type DatabaseData = {
	meta: {
		DBversion: string;
		converted: string;
		source: string;
		creator: string;
		working_categories: string[];
	};
	entries: Record<string, DatabaseEntry>;
};

export type DatabaseEntry = {
	name: string;
	wadname: string;
	md5: string;
	md5alt?: string;
	code1: string;
	code2: string;
	category?: string;
	version: number | string;
	dlname?: string;
	filename?: string;
	// cIOS or patchios
	ciosslot?: string;
	ciosversion?: string;
	basewad?: string;
	md5base?: string;
	md5basealt?: string;
};
