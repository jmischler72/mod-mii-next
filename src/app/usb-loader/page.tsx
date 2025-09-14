'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Archive, Download, Info, Gamepad2, HardDrive, Usb } from 'lucide-react';
import { getLoaderWads, USBLoader, loaderDescriptions } from '@/helpers/usb-loader';



export default function USBLoaderPage() {
	const [selectedLoader, setSelectedLoader] = useState<USBLoader | null>(null);
	const [requiredWads, setRequiredWads] = useState<string[]>([]);
	const [isCreatingArchive, setIsCreatingArchive] = useState<boolean>(false);
	const [downloadMessage, setDownloadMessage] = useState<string>('');

	const handleLoaderSelection = async (loader: USBLoader) => {
		setSelectedLoader(loader);
		try {
			const wads = await getLoaderWads(loader);
			setRequiredWads(wads);
			setDownloadMessage('');
		} catch (error) {
			console.error('Error getting loader WADs:', error);
			setDownloadMessage('Error: Failed to get required files for this loader');
		}
	};

	const handleDownloadWads = async () => {
		if (!selectedLoader || requiredWads.length === 0) {
			setDownloadMessage('Error: No loader selected or no files available');
			return;
		}

		setIsCreatingArchive(true);
		setDownloadMessage('');
		
		try {
			const response = await fetch('/api/wads/create-archive', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					wadnames: requiredWads,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to create archive');
			}

			// Extract download summary from response headers
			const downloadSummaryHeader = response.headers.get('X-Download-Summary');
			let summaryMessage = 'USB Loader files downloaded successfully!';

			if (downloadSummaryHeader) {
				try {
					const summary = JSON.parse(downloadSummaryHeader);
					const totalFiles = summary.totalRequested;

					summaryMessage = `✅ USB Loader files downloaded successfully!

📊 Download Summary:
• Total files requested: ${totalFiles}
• Downloaded: ${summary.downloaded} files
• Downloaded from S3: ${summary.cached} files
• Failed: ${summary.failed} files`;

					if (summary.failedFiles && summary.failedFiles.length > 0) {
						summaryMessage += `

❌ Failed files:
${summary.failedFiles.map((file: string) => `• ${file}`).join('\n')}`;
					}
				} catch (error) {
					console.error('Failed to parse download summary:', error);
				}
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${loaderDescriptions[selectedLoader].name.replace(/\s+/g, '-').toLowerCase()}-files.zip`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			setDownloadMessage(summaryMessage);
		} catch (error) {
			console.error('Archive error:', error);
			setDownloadMessage(`Error creating archive: ${error}`);
		} finally {
			setIsCreatingArchive(false);
		}
	};

	return (
		<div className='min-h-screen bg-black p-4 font-sans sm:p-6'>
			<main className='mx-auto max-w-6xl'>
				<div className='mb-8'>
					<h1 className='mb-4 text-3xl font-bold text-white'>USB Loader Installation</h1>
					<p className='text-gray-300'>
						Choose a USB loader for your Wii console. Each loader has different features and interfaces.
						Select the one that best suits your needs.
					</p>
				</div>

				{/* Loader Selection */}
				<div className='mb-8 grid gap-4 md:grid-cols-3'>
					{Object.entries(loaderDescriptions).map(([key, info]) => {
						const loader = key as USBLoader;
						const isSelected = selectedLoader === loader;
						
						return (
							<div
								key={loader}
								className={`cursor-pointer rounded-lg border p-6 transition-all ${
									isSelected
										? 'border-blue-500 bg-blue-900/20'
										: 'border-gray-700 bg-gray-900 hover:border-gray-600'
								}`}
								onClick={() => handleLoaderSelection(loader)}
							>
								<div className='mb-4 flex items-center gap-3'>
									<div className={`rounded-full p-2 ${isSelected ? 'bg-blue-500' : 'bg-gray-700'}`}>
										{loader === USBLoader.ConfigurableUSBLoader && <Gamepad2 className='h-5 w-5 text-white' />}
										{loader === USBLoader.USBLoaderGX && <Usb className='h-5 w-5 text-white' />}
										{loader === USBLoader.WiiFlow && <HardDrive className='h-5 w-5 text-white' />}
									</div>
									<h3 className='text-lg font-semibold text-white'>{info.name}</h3>
								</div>
								
								<p className='mb-4 text-sm text-gray-300'>{info.description}</p>
								
								<div className='space-y-1'>
									<h4 className='text-sm font-medium text-white'>Features:</h4>
									<ul className='space-y-1'>
										{info.features.map((feature, index) => (
											<li key={index} className='text-xs text-gray-400'>
												• {feature}
											</li>
										))}
									</ul>
								</div>
							</div>
						);
					})}
				</div>

				{/* Installation Instructions */}
				{selectedLoader && (
					<div className='mb-8 rounded-lg border border-gray-700 bg-gray-900 p-6'>
						<h2 className='mb-4 text-xl font-bold text-white'>Installation Instructions</h2>
						<div className='space-y-4 text-gray-300'>
							<div className='rounded-lg bg-yellow-900/20 border border-yellow-600 p-4'>
								<div className='flex items-center gap-2 mb-2'>
									<Info className='h-5 w-5 text-yellow-400' />
									<h3 className='font-semibold text-yellow-400'>Prerequisites</h3>
								</div>
								<ul className='space-y-1 text-sm'>
									<li>• Homebrew Channel must be installed</li>
									<li>• cIOS must be installed (d2x cIOS recommended)</li>
									<li>• USB storage device formatted as FAT32 or NTFS</li>
									<li>• SD card or USB device for homebrew apps</li>
								</ul>
							</div>
							
							<div>
								<h3 className='mb-2 font-semibold text-white'>Step 1: Download Required Files</h3>
								<p className='text-sm'>
									Download the required WAD files and homebrew applications for {loaderDescriptions[selectedLoader].name}.
									The archive will include the loader WAD and essential tools like Nintendont and CleanRip.
								</p>
							</div>
							
							<div>
								<h3 className='mb-2 font-semibold text-white'>Step 2: Install WAD Files</h3>
								<p className='text-sm'>
									Use a WAD manager (like WAD Manager or YAWMM) to install the downloaded WAD files.
									Make sure to install them in the correct order and verify the installation.
								</p>
							</div>
							
							<div>
								<h3 className='mb-2 font-semibold text-white'>Step 3: Copy Homebrew Apps</h3>
								<p className='text-sm'>
									Extract homebrew applications to the apps folder on your SD card or USB device.
									Create the folder structure: /apps/[app-name]/boot.dol
								</p>
							</div>
							
							<div>
								<h3 className='mb-2 font-semibold text-white'>Step 4: Prepare USB Storage</h3>
								<p className='text-sm'>
									Create the required folder structure on your USB storage device:
									/wbfs/ for Wii games, /games/ for GameCube games (if using Nintendont).
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Required Files Section */}
				{selectedLoader && requiredWads.length > 0 && (
					<div className='rounded-lg border border-gray-700 bg-gray-900 p-6'>
						<div className='mb-4 flex items-center justify-between'>
							<h2 className='text-xl font-bold text-white'>
								Required Files for {loaderDescriptions[selectedLoader].name}
							</h2>
							<Button
								onClick={handleDownloadWads}
								disabled={isCreatingArchive}
								className='bg-blue-600 hover:bg-blue-700'
							>
								<Archive className='mr-2 h-4 w-4' />
								{isCreatingArchive ? 'Creating Archive...' : 'Download All Files'}
							</Button>
						</div>
						
						<div className='grid gap-2 md:grid-cols-2 lg:grid-cols-3'>
							{requiredWads.map((wad, index) => (
								<div key={index} className='rounded bg-gray-800 p-3'>
									<div className='flex items-center gap-2'>
										<Download className='h-4 w-4 text-blue-400' />
										<span className='font-mono text-sm text-white'>{wad}</span>
									</div>
								</div>
							))}
						</div>
						
						{downloadMessage && (
							<div
								className={`mt-4 rounded-lg p-3 ${
									downloadMessage.startsWith('Error')
										? 'bg-red-900/20 border border-red-600 text-red-300'
										: 'bg-green-900/20 border border-green-600 text-green-300'
								}`}
							>
								<p className='whitespace-pre-line text-sm'>{downloadMessage}</p>
							</div>
						)}
					</div>
				)}
			</main>
		</div>
	);
}
