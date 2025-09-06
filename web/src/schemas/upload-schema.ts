import { z } from 'zod';

export const MAX_FILE_SIZE = 5000000; // 5MB
export const ACCEPTED_FILE_TYPES = ['text/csv', 'application/vnd.ms-excel'];

// Base file validation schema
const fileSchema = z
	.any()
	.refine((file): file is File => file instanceof File, 'Please select a file')
	.refine((file: File) => file.size <= MAX_FILE_SIZE, 'File size should be less than 5MB')
	.refine(
		(file: File) => ACCEPTED_FILE_TYPES.includes(file.type) || file.name.endsWith('.csv'),
		'Only CSV files are allowed',
	);

// Server-side schema for FormData validation
export const uploadFormDataSchema = z.object({
	file: fileSchema,
	activeIOS: z
		.string()
		.transform((val) => val === 'true')
		.pipe(z.boolean()),
	extraProtection: z
		.string()
		.transform((val) => val === 'true')
		.pipe(z.boolean()),
});

// Client-side schema for form validation
export const uploadFormSchema = z.object({
	file: fileSchema,
	activeIOS: z.boolean(),
	extraProtection: z.boolean(),
});

// Type exports
export type UploadFormData = z.infer<typeof uploadFormDataSchema>;
export type UploadFormValues = z.infer<typeof uploadFormSchema>;
