// Mock fetch for testing archive creation
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Archive Download Tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('createArchive function', () => {
		it('should create an archive from multiple files', async () => {
			// Mock successful file downloads
			const mockFiles = [
				{ wadname: 'test1.wad', s3Url: 'https://s3.example.com/test1.wad' },
				{ wadname: 'test2.wad', s3Url: 'https://s3.example.com/test2.wad' },
			];

			const mockFileContent1 = Buffer.from('mock wad file 1 content');
			const mockFileContent2 = Buffer.from('mock wad file 2 content');

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					arrayBuffer: () => Promise.resolve(mockFileContent1.buffer),
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					arrayBuffer: () => Promise.resolve(mockFileContent2.buffer),
				} as Response);

			// Import and call the actual function
			const { createArchive } = await import('../src/actions/create-archive');
			const result = await createArchive(mockFiles);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(mockFetch).toHaveBeenCalledWith('https://s3.example.com/test1.wad');
			expect(mockFetch).toHaveBeenCalledWith('https://s3.example.com/test2.wad');
		});

		it('should handle failed file downloads gracefully', async () => {
			const mockFiles = [
				{ wadname: 'test1.wad', s3Url: 'https://s3.example.com/test1.wad' },
				{ wadname: 'test2.wad', s3Url: 'https://s3.example.com/test2.wad' },
			];

			const mockFileContent = Buffer.from('mock wad file content');

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					arrayBuffer: () => Promise.resolve(mockFileContent.buffer),
				} as Response)
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
				} as Response);

			const { createArchive } = await import('../src/actions/create-archive');
			const result = await createArchive(mockFiles);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it('should handle empty file list', async () => {
			const { createArchive } = await import('../src/actions/create-archive');
			const result = await createArchive([]);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0); // Even empty zip has some minimal size
		});

		it('should handle network errors during file download', async () => {
			const mockFiles = [{ wadname: 'test1.wad', s3Url: 'https://s3.example.com/test1.wad' }];

			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			const { createArchive } = await import('../src/actions/create-archive');
			const result = await createArchive(mockFiles);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should create a valid ZIP file with proper structure', async () => {
			const mockFiles = [
				{ wadname: 'test1.wad', s3Url: 'https://s3.example.com/test1.wad' },
				{ wadname: 'test2.wad', s3Url: 'https://s3.example.com/test2.wad' },
			];

			const mockFileContent1 = Buffer.from('mock wad file 1 content');
			const mockFileContent2 = Buffer.from('mock wad file 2 content');

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					arrayBuffer: () => Promise.resolve(mockFileContent1.buffer),
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					arrayBuffer: () => Promise.resolve(mockFileContent2.buffer),
				} as Response);

			const { createArchive } = await import('../src/actions/create-archive');
			const result = await createArchive(mockFiles);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);

			// Verify that we got a real zip file (starts with PK signature)
			expect(result.slice(0, 2)).toEqual(Buffer.from([0x50, 0x4b])); // ZIP file signature

			// The zip should contain both files
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it('should handle files with special characters in names', async () => {
			const mockFiles = [
				{ wadname: 'test file with spaces.wad', s3Url: 'https://s3.example.com/test1.wad' },
				{ wadname: 'test-file_with@symbols.wad', s3Url: 'https://s3.example.com/test2.wad' },
			];

			const mockFileContent = Buffer.from('mock content');

			mockFetch.mockResolvedValue({
				ok: true,
				arrayBuffer: () => Promise.resolve(mockFileContent.buffer),
			} as Response);

			const { createArchive } = await import('../src/actions/create-archive');
			const result = await createArchive(mockFiles);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
			expect(result.slice(0, 2)).toEqual(Buffer.from([0x50, 0x4b])); // ZIP file signature
		});

		it('should handle large files', async () => {
			const mockFiles = [{ wadname: 'large-file.wad', s3Url: 'https://s3.example.com/large-file.wad' }];

			// Create a large mock file (1MB)
			const largeContent = Buffer.alloc(1024 * 1024, 'a');

			mockFetch.mockResolvedValueOnce({
				ok: true,
				arrayBuffer: () => Promise.resolve(largeContent.buffer),
			} as Response);

			const { createArchive } = await import('../src/actions/create-archive');
			const result = await createArchive(mockFiles);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
			expect(result.slice(0, 2)).toEqual(Buffer.from([0x50, 0x4b])); // ZIP file signature

			// The compressed file should be smaller than the original
			expect(result.length).toBeLessThan(largeContent.length);
		});

		it('should handle mixed success and failure scenarios', async () => {
			const mockFiles = [
				{ wadname: 'success.wad', s3Url: 'https://s3.example.com/success.wad' },
				{ wadname: 'fail.wad', s3Url: 'https://s3.example.com/fail.wad' },
				{ wadname: 'network-error.wad', s3Url: 'https://s3.example.com/network-error.wad' },
			];

			const mockFileContent = Buffer.from('success content');

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					arrayBuffer: () => Promise.resolve(mockFileContent.buffer),
				} as Response)
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
				} as Response)
				.mockRejectedValueOnce(new Error('Network error'));

			const { createArchive } = await import('../src/actions/create-archive');
			const result = await createArchive(mockFiles);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
			expect(result.slice(0, 2)).toEqual(Buffer.from([0x50, 0x4b])); // ZIP file signature

			// Should have tried to download all files
			expect(mockFetch).toHaveBeenCalledTimes(3);
		});
	});

	describe('Archive creation edge cases', () => {
		it('should handle extremely long file names', async () => {
			const longFileName = 'a'.repeat(200) + '.wad';
			const mockFiles = [{ wadname: longFileName, s3Url: 'https://s3.example.com/test.wad' }];

			const mockFileContent = Buffer.from('content');

			mockFetch.mockResolvedValueOnce({
				ok: true,
				arrayBuffer: () => Promise.resolve(mockFileContent.buffer),
			} as Response);

			const { createArchive } = await import('../src/actions/create-archive');
			const result = await createArchive(mockFiles);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
			expect(result.slice(0, 2)).toEqual(Buffer.from([0x50, 0x4b])); // ZIP file signature
		});

		it('should handle duplicate file names', async () => {
			const mockFiles = [
				{ wadname: 'duplicate.wad', s3Url: 'https://s3.example.com/file1.wad' },
				{ wadname: 'duplicate.wad', s3Url: 'https://s3.example.com/file2.wad' },
			];

			const mockFileContent1 = Buffer.from('content 1');
			const mockFileContent2 = Buffer.from('content 2');

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					arrayBuffer: () => Promise.resolve(mockFileContent1.buffer),
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					arrayBuffer: () => Promise.resolve(mockFileContent2.buffer),
				} as Response);

			const { createArchive } = await import('../src/actions/create-archive');
			const result = await createArchive(mockFiles);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
			expect(result.slice(0, 2)).toEqual(Buffer.from([0x50, 0x4b])); // ZIP file signature
		});

		it('should handle empty file content', async () => {
			const mockFiles = [{ wadname: 'empty.wad', s3Url: 'https://s3.example.com/empty.wad' }];

			const emptyContent = Buffer.alloc(0);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				arrayBuffer: () => Promise.resolve(emptyContent.buffer),
			} as Response);

			const { createArchive } = await import('../src/actions/create-archive');
			const result = await createArchive(mockFiles);

			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
			expect(result.slice(0, 2)).toEqual(Buffer.from([0x50, 0x4b])); // ZIP file signature
		});
	});
});
