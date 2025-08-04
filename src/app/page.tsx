'use client';

import { SyscheckFileUploadForm } from '@/components/syscheck-file-upload-form';
import { useState } from 'react';
import { UploadSyscheckData, UploadSyscheckResult } from '@/types/upload-syscheck-type';
import { Button } from '@/components/ui/button';
import { Download, Archive } from 'lucide-react';

export default function Home() {
	const [uploadMessage, setUploadMessage] = useState<string>('');
	const [uploadData, setUploadData] = useState<UploadSyscheckData | null>(null);
	const [isCreatingArchive, setIsCreatingArchive] = useState<boolean>(false);

	const handleUploadSuccess = (result: UploadSyscheckResult) => {
		setUploadMessage(result.message || 'File uploaded successfully!');
		setUploadData(result.data || null);
		console.log('Upload successful:', result);
	};

	const handleUploadError = (error: string) => {
		setUploadMessage(`Error: ${error}`);
		setUploadData(null);
		console.error('Upload error:', error);
	};

	const handleDownloadArchive = async () => {
		if (!uploadData?.downloadSummary?.s3Files) {
			setUploadMessage('No files available for archive');
			return;
		}

		setIsCreatingArchive(true);
		try {
			const response = await fetch('/api/wads/archive', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					s3Files: uploadData.downloadSummary.s3Files,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to create archive');
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'wad-files.zip';
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			setUploadMessage('Archive downloaded successfully!');
		} catch (error) {
			console.error('Archive error:', error);
			setUploadMessage(`Error creating archive: ${error}`);
		} finally {
			setIsCreatingArchive(false);
		}
	};

	return (
		<div className='grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-sans sm:p-20'>
			<main className='row-start-2 flex flex-col items-center gap-[32px] sm:items-start'>
				<div className='w-full max-w-2xl'>
					<h1 className='mb-8 text-center text-2xl font-bold'>CSV File Upload</h1>
					<SyscheckFileUploadForm
						onUploadSuccess={handleUploadSuccess}
						onUploadError={handleUploadError}
						className='mx-auto'
					/>

					{uploadMessage && (
						<div
							className={`mt-4 rounded-lg p-4 ${uploadMessage.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
						>
							<p className='font-medium'>{uploadMessage}</p>
						</div>
					)}

					{uploadData && (
						<div className='mt-6 rounded-lg bg-blue-50 p-4'>
							<h3 className='mb-2 font-semibold text-blue-900'>File Information</h3>
							<div className='space-y-1 text-sm text-blue-800'>
								<p>
									<strong>Filename:</strong> {uploadData.filename}
								</p>
								<p>
									<strong>Size:</strong> {(uploadData.size / 1024).toFixed(2)} KB
								</p>
								<p>
									<strong>Region:</strong> {uploadData.region}
								</p>
								<p>
									<strong>HBC Version:</strong> {uploadData.hbcVersion}
								</p>
								<p>
									<strong>System Menu Version:</strong> {uploadData.systemMenuVersion}
								</p>
							</div>
							{uploadData.preview && uploadData.preview.length > 0 && (
								<div className='mt-3'>
									<h4 className='mb-1 font-medium text-blue-900'>Preview:</h4>
									<div className='overflow-x-auto rounded border bg-white p-2 text-xs text-gray-700'>
										{uploadData.preview.map((line, index) => (
											<div key={index} className='font-mono'>
												{line}
											</div>
										))}
									</div>
								</div>
							)}
							{uploadData.wadToInstall && uploadData.wadToInstall.length > 0 && (
								<div className='mt-3'>
									<h4 className='mb-1 font-medium text-blue-900'>WADs to Install:</h4>
									<div className='rounded border bg-white p-2 text-xs text-gray-700'>
										{uploadData.wadToInstall.join(', ')}
									</div>
								</div>
							)}
							{uploadData.downloadSummary && (
								<div className='mt-4'>
									<h4 className='mb-2 font-medium text-blue-900'>Download Summary:</h4>
									<div className='rounded border bg-white p-3'>
										<div className='mb-3 grid grid-cols-3 gap-4 text-sm'>
											<div className='text-center'>
												<div className='font-semibold text-green-600'>{uploadData.downloadSummary.downloaded}</div>
												<div className='text-gray-600'>Downloaded</div>
											</div>
											<div className='text-center'>
												<div className='font-semibold text-blue-600'>{uploadData.downloadSummary.cached}</div>
												<div className='text-gray-600'>Cached</div>
											</div>
											<div className='text-center'>
												<div className='font-semibold text-red-600'>{uploadData.downloadSummary.failed}</div>
												<div className='text-gray-600'>Failed</div>
											</div>
										</div>

										{uploadData.downloadSummary.s3Files && uploadData.downloadSummary.s3Files.length > 0 && (
											<div className='border-t pt-3'>
												<div className='mb-2 flex items-center justify-between'>
													<h5 className='font-medium text-blue-800'>Available Files:</h5>
													<Button
														onClick={handleDownloadArchive}
														disabled={isCreatingArchive}
														size='sm'
														variant='outline'
														className='ml-2'
													>
														<Archive className='mr-1 h-4 w-4' />
														{isCreatingArchive ? 'Creating Archive...' : 'Download All as ZIP'}
													</Button>
												</div>
												<div className='space-y-2'>
													{uploadData.downloadSummary.s3Files.map((file, index) => (
														<div key={index} className='flex items-center justify-between rounded bg-gray-50 p-2'>
															<span className='font-mono text-sm text-gray-700'>{file.wadname}</span>
														</div>
													))}
												</div>
											</div>
										)}

										{uploadData.downloadSummary.failedFiles && uploadData.downloadSummary.failedFiles.length > 0 && (
											<div className='mt-3 border-t pt-3'>
												<h5 className='mb-2 font-medium text-red-800'>Failed Downloads:</h5>
												<div className='rounded bg-red-50 p-2 text-sm text-red-700'>
													{uploadData.downloadSummary.failedFiles.join(', ')}
												</div>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
