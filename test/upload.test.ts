import { uploadSyscheckFile } from '../src/actions/upload-syscheck-file';
import { readFileSync } from 'fs';
import { join } from 'path';
import { mockSyscheckData } from './testData';
import { MockFile, MockFormData } from './types'; // Assuming you have a utility to mock FormData and File

describe('CSV Upload Tests', () => {
	let validSyscheckContent: string;

	beforeAll(() => {
		// Read the test CSV file
		validSyscheckContent = readFileSync(join(__dirname, '..', 'test-syscheck.csv'), 'utf-8');
	});

	describe('uploadCsvFile - Basic Functionality', () => {
		it('should successfully process a valid SysCheck CSV file', async () => {
			// Create a mock file
			const mockFile = new MockFile(validSyscheckContent, 'test-syscheck.csv', { type: 'text/csv' });

			// Create mock FormData
			const formData = new MockFormData();
			formData.append('file', mockFile);

			// Test the upload function
			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(true);
			expect(result.message).toContain('uploaded successfully');
			expect(result.data).toBeDefined();
			expect(result.data?.filename).toBe('test-syscheck.csv');
			expect(result.data?.size).toBe(validSyscheckContent.length);
			expect(result.data?.region).toBeDefined();
			expect(result.data?.hbcVersion).toBeDefined();
		});

		it('should handle missing file', async () => {
			const formData = new MockFormData();

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(false);
			expect(result.error).toBe('No file provided');
		});

		it('should reject files that are too large', async () => {
			// Create a large content string (over 5MB)
			const largeContent = 'a'.repeat(5000001);
			const mockFile = new MockFile(largeContent, 'large-file.csv', { type: 'text/csv' });

			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(false);
			expect(result.error).toContain('File size should be less than 5MB');
		});

		it('should reject empty files', async () => {
			const mockFile = new MockFile('', 'empty.csv', { type: 'text/csv' });

			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(false);
			expect(result.error).toContain('empty');
		});

		it('should reject files with wrong extension', async () => {
			const mockFile = new MockFile('some content', 'test.txt', { type: 'text/plain' });

			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Only CSV files are allowed');
		});
	});

	describe('uploadCsvFile - SysCheck Validation', () => {
		it('should reject invalid SysCheck data', async () => {
			const mockFile = new MockFile(mockSyscheckData.invalid, 'invalid.csv', { type: 'text/csv' });

			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(false);
			expect(result.error).toContain('valid SysCheck report');
		});

		it('should detect PAL region from the test file', async () => {
			const mockFile = new MockFile(validSyscheckContent, 'test-syscheck.csv', { type: 'text/csv' });

			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(true);
			expect(result.data?.region).toBe('PAL');
		});

		it('should detect NTSC-U region', async () => {
			const mockFile = new MockFile(mockSyscheckData.ntscData, 'ntsc.csv', { type: 'text/csv' });

			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(true);
			expect(result.data?.region).toBe('NTSC-U');
		});

		it('should detect NTSC-J region', async () => {
			const mockFile = new MockFile(mockSyscheckData.japanData, 'japan.csv', { type: 'text/csv' });

			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(true);
			expect(result.data?.region).toBe('NTSC-J');
		});

		it('should handle files without console type validation', async () => {
			const mockFile = new MockFile(mockSyscheckData.withoutConsoleType, 'no-console.csv', { type: 'text/csv' });

			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(false);
			expect(result.error).toContain('valid console type');
		});
	});

	describe('uploadCsvFile - File Format Edge Cases', () => {
		it('should handle files with .csv extension even with wrong MIME type', async () => {
			const mockFile = new MockFile(validSyscheckContent, 'test.csv', { type: 'application/octet-stream' });

			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(true);
			expect(result.data?.filename).toBe('test.csv');
		});

		it('should handle whitespace-only files', async () => {
			const whitespaceContent = '   \n\n\t  \n  ';
			const mockFile = new MockFile(whitespaceContent, 'whitespace.csv', { type: 'text/csv' });

			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(false);
			expect(result.error).toContain('empty');
		});

		it('should handle files with special characters in filename', async () => {
			const mockFile = new MockFile(validSyscheckContent, 'test-file_with-special@chars.csv', { type: 'text/csv' });

			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(true);
			expect(result.data?.filename).toBe('test-file_with-special@chars.csv');
		});

		it('should handle files with Microsoft Excel MIME type', async () => {
			const mockFile = new MockFile(validSyscheckContent, 'test.csv', { type: 'application/vnd.ms-excel' });

			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(true);
			expect(result.data?.filename).toBe('test.csv');
		});
	});

	describe('uploadCsvFile - Error Handling', () => {
		it('should handle malformed FormData gracefully', async () => {
			const formData = new MockFormData();
			formData.append('file', 'not-a-file');

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('should return proper error structure', async () => {
			const formData = new MockFormData();

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result).toHaveProperty('success');
			expect(result).toHaveProperty('error');
			expect(result.success).toBe(false);
			expect(typeof result.error).toBe('string');
		});

		it('should return proper success structure', async () => {
			const mockFile = new MockFile(validSyscheckContent, 'test.csv', { type: 'text/csv' });
			const formData = new MockFormData();
			formData.append('file', mockFile);

			const result = await uploadSyscheckFile(formData as unknown as FormData);

			expect(result).toHaveProperty('success');
			expect(result).toHaveProperty('message');
			expect(result).toHaveProperty('data');
			expect(result.success).toBe(true);
			expect(typeof result.message).toBe('string');
			expect(result.data).toHaveProperty('filename');
			expect(result.data).toHaveProperty('size');
			expect(result.data).toHaveProperty('region');
			expect(result.data).toHaveProperty('hbcVersion');
		});
	});
});
