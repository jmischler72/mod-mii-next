'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface UseDownloadOptions {
	onSuccess?: (filename: string) => void;
	onError?: (error: Error, wadname: string) => void;
}

export function useDownload(options: UseDownloadOptions = {}) {
	const { toast } = useToast();
	const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

	const downloadFile = async (wadId: string, wadname: string) => {
		if (downloadingFiles.has(wadId)) {
			toast({
				title: 'Download in progress',
				description: `${wadname} is already being downloaded`,
				variant: 'default',
			});
			return;
		}

		setDownloadingFiles((prev) => new Set(prev).add(wadId));

		try {
			console.log('Download requested for:', wadname, 'with ID:', wadId);

			toast({
				title: 'Starting download',
				description: `Preparing ${wadname} for download...`,
				variant: 'default',
			});

			// Add timeout for the request
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

			const response = await fetch('/api/wads/download', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ wadId }),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				let errorMessage = `Download failed: ${response.status} ${response.statusText}`;

				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorMessage;
				} catch {
					// If response is not JSON, use the status text
				}

				throw new Error(errorMessage);
			}

			// Check if the response has content
			const contentLength = response.headers.get('content-length');
			if (contentLength === '0' || contentLength === null) {
				throw new Error('Downloaded file is empty or corrupted');
			}

			// Get the file as a blob
			const blob = await response.blob();

			if (blob.size === 0) {
				throw new Error('Downloaded file is empty');
			}

			// Extract filename from Content-Disposition header if available
			let filename = wadname; // Default to original wadname
			const contentDisposition = response.headers.get('content-disposition');
			if (contentDisposition) {
				const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
				if (filenameMatch && filenameMatch[1]) {
					// Remove quotes if present
					filename = filenameMatch[1].replace(/['"]/g, '');
				}
			}

			// Create a download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = filename; // Use server-provided filename

			// Ensure the link is added to the DOM before clicking
			document.body.appendChild(link);
			link.click();

			// Clean up
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			console.log('Download completed for:', filename);

			toast({
				title: 'Download successful',
				description: `${filename} has been downloaded successfully`,
				variant: 'success',
			});

			// Call success callback if provided
			options.onSuccess?.(filename);
		} catch (error) {
			console.error('Download error:', error);

			let errorMessage = 'Unknown download error occurred';
			let errorTitle = 'Download failed';

			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					errorTitle = 'Download timeout';
					errorMessage = 'Download request timed out. Please check your connection and try again.';
				} else if (error.message.includes('Failed to fetch')) {
					errorTitle = 'Network error';
					errorMessage = 'Unable to connect to the server. Please check your internet connection.';
				} else if (error.message.includes('404')) {
					errorTitle = 'File not found';
					errorMessage = 'The requested file could not be found on the server.';
				} else if (error.message.includes('403')) {
					errorTitle = 'Access denied';
					errorMessage = 'You do not have permission to download this file.';
				} else if (error.message.includes('500')) {
					errorTitle = 'Server error';
					errorMessage = 'The server encountered an error while processing your request.';
				} else {
					errorMessage = error.message;
				}
			}

			toast({
				title: errorTitle,
				description: `Failed to download ${wadname}: ${errorMessage}`,
				variant: 'destructive',
			});

			// Call error callback if provided
			if (error instanceof Error) {
				options.onError?.(error, wadname);
			}
		} finally {
			setDownloadingFiles((prev) => {
				const newSet = new Set(prev);
				newSet.delete(wadId);
				return newSet;
			});
		}
	};

	const isDownloading = (wadId: string) => downloadingFiles.has(wadId);

	return {
		downloadFile,
		downloadingFiles,
		isDownloading,
	};
}
