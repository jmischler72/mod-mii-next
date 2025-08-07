export class MockFile extends File {
	content: string;

	constructor(content: string, filename: string, options: { type?: string } = {}) {
		super([content], filename, { type: options.type || 'text/csv' });
		this.content = content;
	}

	async text(): Promise<string> {
		return this.content;
	}

	async arrayBuffer(): Promise<ArrayBuffer> {
		const buffer = new ArrayBuffer(this.content.length);
		const view = new Uint8Array(buffer);
		for (let i = 0; i < this.content.length; i++) {
			view[i] = this.content.charCodeAt(i);
		}
		return buffer;
	}

	async bytes(): Promise<Uint8Array> {
		return new TextEncoder().encode(this.content);
	}
}

export class MockFormData {
	private data = new Map<string, File | string>();

	append(key: string, value: File | string) {
		this.data.set(key, value);
	}

	get(key: string) {
		return this.data.get(key);
	}

	delete(key: string) {
		this.data.delete(key);
	}

	has(key: string) {
		return this.data.has(key);
	}

	set(key: string, value: File | string) {
		this.data.set(key, value);
	}

	getAll(key: string) {
		const value = this.data.get(key);
		return value ? [value] : [];
	}

	keys() {
		return this.data.keys();
	}

	values() {
		return this.data.values();
	}

	entries() {
		return this.data.entries();
	}

	forEach(callback: (value: File | string, key: string) => void) {
		this.data.forEach(callback);
	}
}
