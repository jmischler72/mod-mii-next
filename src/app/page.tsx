'use client';

import { SyscheckFileUploadForm } from '@/components/syscheck-file-upload-form';
import { useState } from 'react';
import { UploadSyscheckData, UploadSyscheckResult } from '@/types/upload-syscheck-type';
import { Button } from '@/components/ui/button';
import { Archive, Info } from 'lucide-react';
import Link from 'next/link';

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
		if (!uploadData?.wadsInfos) {
			setUploadMessage('No files available for archive');
			return;
		}

		console.log('Creating archive with files:', uploadData.wadsInfos);
		setIsCreatingArchive(true);
		try {
			const response = await fetch('/api/wads/create-archive', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					wadnames: uploadData.wadsInfos.filter((file) => file.wadname !== undefined).map((file) => file.wadId),
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
		<div className='flex min-h-screen items-center justify-center bg-black p-4 font-sans sm:p-6'>
			<main className='w-full max-w-4xl'>
				<div className='w-full'>
					<div className='mb-4 flex items-center justify-between'>
						<h1 className='flex-1 text-center text-xl font-bold text-white'>Wii Syscheck Updater</h1>
						<Link href='/about'>
							<Button variant='outline' size='sm' className='border-white text-white hover:bg-white hover:text-black'>
								<Info className='mr-1 h-4 w-4' />
								About
							</Button>
						</Link>
					</div>

					{/* Upload Form Section */}
					<div className='rounded-lg border border-gray-700 bg-gray-900 p-6'>
						<SyscheckFileUploadForm
							onUploadSuccess={handleUploadSuccess}
							onUploadError={handleUploadError}
							className='mx-auto'
						/>
					</div>

					{uploadMessage && (
						<div
							className={`mt-2 rounded-lg p-3 ${uploadMessage.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
						>
							<p className='text-sm font-medium'>{uploadMessage}</p>
						</div>
					)}

					{uploadData && (
						<div className='mt-4 grid gap-3 lg:grid-cols-2'>
							{/* Basic File Information */}
							<div className='rounded-lg bg-blue-50 p-3'>
								<h3 className='mb-2 text-sm font-semibold text-blue-900'>File Information</h3>
								<div className='space-y-1 text-xs text-blue-800'>
									<p>
										<strong>Filename:</strong> {uploadData.filename}
									</p>
									<p>
										<strong>Size:</strong> {(uploadData.size / 1024).toFixed(2)} KB
									</p>
								</div>
							</div>

							{/* System Information */}
							<div className='rounded-lg bg-green-50 p-3'>
								<h3 className='mb-2 text-sm font-semibold text-green-900'>System Information</h3>
								<div className='grid grid-cols-2 gap-1 text-xs text-green-800'>
									<p>
										<strong>Console:</strong> {uploadData.consoleType}
									</p>
									<p>
										<strong>Region:</strong> {uploadData.region}
									</p>
									<p>
										<strong>System Menu:</strong> {uploadData.systemMenuVersion}
									</p>
									<p>
										<strong>HBC:</strong> {uploadData.hbcVersion}
									</p>
									<p>
										<strong>Firmware:</strong> {uploadData.firmware.firmware}
									</p>
									<p>
										<strong>Version:</strong> {uploadData.firmware.firmwareVersion}
									</p>
								</div>
							</div>

							{/* System Status */}
							<div className='rounded-lg bg-yellow-50 p-3'>
								<h3 className='mb-2 text-sm font-semibold text-yellow-900'>System Status</h3>
								<div className='space-y-1 text-xs text-yellow-800'>
									<div className='flex items-center gap-2'>
										<span
											className={`h-2 w-2 rounded-full ${uploadData.systemChecks.isBootMiiInstalled ? 'bg-green-500' : 'bg-red-500'}`}
										></span>
										<span>BootMii: {uploadData.systemChecks.isBootMiiInstalled ? 'Installed' : 'Not Installed'}</span>
									</div>
									<div className='flex items-center gap-2'>
										<span
											className={`h-2 w-2 rounded-full ${uploadData.systemChecks.isPriiloaderInstalled ? 'bg-green-500' : 'bg-red-500'}`}
										></span>
										<span>
											Priiloader: {uploadData.systemChecks.isPriiloaderInstalled ? 'Installed' : 'Not Installed'}
										</span>
									</div>
									<div className='flex items-center gap-2'>
										<span
											className={`h-2 w-2 rounded-full ${!uploadData.systemChecks.isHbcOutdated ? 'bg-green-500' : 'bg-yellow-500'}`}
										></span>
										<span>HBC: {uploadData.systemChecks.isHbcOutdated ? 'Outdated' : 'Up to Date'}</span>
									</div>

									{uploadData.systemChecks.missingIOS.length > 0 && (
										<div className='mt-1'>
											<p className='font-medium'>Missing IOS:</p>
											<p className='text-xs'>{uploadData.systemChecks.missingIOS.join(', ')}</p>
										</div>
									)}

									{uploadData.systemChecks.outdatedD2XCios.length > 0 && (
										<div className='mt-1'>
											<p className='font-medium'>Outdated d2x cIOS:</p>
											<p className='text-xs'>{uploadData.systemChecks.outdatedD2XCios.join(', ')}</p>
										</div>
									)}
								</div>
							</div>

							{/* WAD Files */}
							{uploadData.wadsInfos && uploadData.wadsInfos.length > 0 && (
								<div className='rounded-lg bg-purple-50 p-3'>
									<div className='mb-2 flex items-center justify-between'>
										<h3 className='text-sm font-semibold text-purple-900'>
											Required WAD Files ({uploadData.wadsInfos.length})
										</h3>
										<Button
											onClick={handleDownloadArchive}
											disabled={isCreatingArchive}
											size='sm'
											variant='outline'
											className='ml-2'
										>
											<Archive className='mr-1 h-3 w-3' />
											{isCreatingArchive ? 'Creating...' : 'Download ZIP'}
										</Button>
									</div>
									<div className='max-h-32 space-y-1 overflow-y-auto'>
										{uploadData.wadsInfos.map((file, index) => (
											<div key={index} className='flex items-center justify-between rounded bg-white p-2 shadow-sm'>
												<span className='font-mono text-xs text-gray-700'>{file.wadname}</span>
												<span className='text-xs text-gray-500'>{file.wadId}</span>
											</div>
										))}
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
