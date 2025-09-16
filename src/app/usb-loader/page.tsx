'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Archive, Download, Info, Gamepad2, HardDrive, Usb, HelpCircle } from 'lucide-react';
import { getLoaderWads, USBLoader, loaderDescriptions } from '@/helpers/usb-loader';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';



export default function USBLoaderPage() {
	const [selectedLoader, setSelectedLoader] = useState<USBLoader | null>(null);
	const [requiredWads, setRequiredWads] = useState<string[]>([]);
	const [isCreatingArchive, setIsCreatingArchive] = useState<boolean>(false);
	const [downloadMessage, setDownloadMessage] = useState<string>('');
	const [isSetupGuideOpen, setIsSetupGuideOpen] = useState<boolean>(false);

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
					<div className='mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
						<p className='mb-4 text-gray-300 sm:mb-0'>
							Choose a USB loader for your Wii console. Each loader has different features and interfaces.
							Select the one that best suits your needs.
						</p>

						<Dialog open={isSetupGuideOpen} onOpenChange={setIsSetupGuideOpen}>
							<DialogTrigger asChild>
								<Button variant='outline' className='flex shrink-0 items-center gap-2'>
									<HelpCircle className='h-4 w-4' />
									Hard Drive Setup Guide
								</Button>
							</DialogTrigger>
							<DialogContent className='max-h-[90vh] max-w-5xl overflow-y-auto'>
								<DialogHeader>
									<DialogTitle className='flex items-center gap-2'>
										<HardDrive className='h-5 w-5 text-blue-400' />
										USB Loader and Hard Drive Setup Guide
									</DialogTitle>
									<DialogDescription>
										Complete guide for setting up external hard drives for Wii USB loaders
									</DialogDescription>
								</DialogHeader>

								<div className='space-y-6 text-gray-300'>

									{/* Step 1: Set Partition Style to MBR */}
									<div>
										<h3 className='mb-4 text-lg font-semibold text-white'>Step 1: Set External Hard Drive Partition Style to MBR</h3>
										<div className='space-y-4'>
											<div className='rounded-lg border border-yellow-600 bg-yellow-900/20 p-4'>
												<h4 className='mb-2 font-medium text-yellow-200'>🔍 Check Current Partition Style</h4>
												<ol className='ml-4 list-decimal space-y-2 text-sm text-yellow-100'>
													<li>Plug your hard drive into your PC</li>
													<li>Right-click "This PC" or "My Computer" and select "Manage"</li>
													<li>In the left panel, click "Disk Management"</li>
													<li>Right-click your disk and select "Properties"</li>
													<li>Select the "Volumes" tab to check "Partition style"</li>
												</ol>
												<p className='mt-2 text-xs text-yellow-200'>
													💡 Use <kbd className='rounded bg-gray-800 px-1'>⊞ Win+E</kbd> if "This PC" is not on desktop
												</p>
											</div>

											<div className='rounded-lg border border-red-600 bg-red-900/20 p-4'>
												<h4 className='mb-2 font-medium text-red-200'>⚠️ Drive Size Limitations</h4>
												<ul className='ml-4 list-disc space-y-1 text-sm text-red-100'>
													<li><strong>Drives {'>'}2TB:</strong> Must follow specialized guides for Western Digital or Seagate drives</li>
													<li><strong>Drives ≤2TB:</strong> Can use standard conversion methods below</li>
													<li><strong>Unsupported {'>'}2TB drives:</strong> Currently not compatible</li>
												</ul>
											</div>

											<div className='space-y-4'>
												<h4 className='font-medium text-white'>Conversion Methods (choose one):</h4>
												
												{/* Method 1: MiniTool */}
												<div className='rounded-lg border border-gray-600 bg-gray-800 p-4'>
													<h5 className='mb-2 font-medium text-white'>Method 1: MiniTool Partition Wizard (Data Preserved)</h5>
													<ol className='ml-4 list-decimal space-y-1 text-sm text-gray-300'>
														<li>Download and install MiniTool Partition Wizard</li>
														<li>Right-click your GPT disk and choose "Convert GPT Disk to MBR Disk"</li>
														<li>Click "Apply" in the toolbar</li>
														<li>Click "Yes" to confirm conversion</li>
														<li>Wait for completion and click "OK"</li>
													</ol>
													<p className='mt-2 text-xs text-yellow-300'>
														⚠️ Even though data should be preserved, always backup important files first
													</p>
												</div>

												{/* Method 2: Windows Disk Management */}
												<div className='rounded-lg border border-gray-600 bg-gray-800 p-4'>
													<h5 className='mb-2 font-medium text-white'>Method 2: Windows Disk Management</h5>
													<p className='text-sm text-gray-300'>Available through the same Disk Management interface used for checking partition style</p>
												</div>

												{/* Method 3: DiskPart */}
												<div className='rounded-lg border border-gray-600 bg-gray-800 p-4'>
													<h5 className='mb-2 font-medium text-white'>Method 3: DiskPart (Command Line)</h5>
													<p className='text-sm text-gray-300'>Advanced command-line method for experienced users</p>
												</div>
											</div>
										</div>
									</div>

									{/* Step 2: Format Drive */}
									<div>
										<h3 className='mb-4 text-lg font-semibold text-white'>Step 2: Partition and Format the External Hard Drive</h3>
										
										{/* Format Options */}
										<div className='mb-4 grid gap-4 md:grid-cols-3'>
											<div className='rounded-lg border border-green-600 bg-green-900/20 p-4'>
												<h4 className='mb-2 font-medium text-green-200'>FAT32 (Recommended)</h4>
												<div className='space-y-2 text-sm'>
													<div>
														<p className='font-medium text-green-300'>Pros:</p>
														<ul className='ml-4 list-disc text-xs text-green-100'>
															<li>Wii can access without SD card</li>
															<li>GameCube games compatible</li>
															<li>SNEEK/NAND emulation support</li>
														</ul>
													</div>
													<div>
														<p className='font-medium text-green-300'>Cons:</p>
														<ul className='ml-4 list-disc text-xs text-green-100'>
															<li>4GB file size limit (games auto-split)</li>
														</ul>
													</div>
												</div>
											</div>
											
											<div className='rounded-lg border border-blue-600 bg-blue-900/20 p-4'>
												<h4 className='mb-2 font-medium text-blue-200'>NTFS</h4>
												<div className='space-y-2 text-sm'>
													<div>
														<p className='font-medium text-blue-300'>Pros:</p>
														<ul className='ml-4 list-disc text-xs text-blue-100'>
															<li>No file size limitations</li>
															<li>Better for large files</li>
														</ul>
													</div>
													<div>
														<p className='font-medium text-blue-300'>Cons:</p>
														<ul className='ml-4 list-disc text-xs text-blue-100'>
															<li>Requires SD card for some features</li>
															<li>Limited GameCube compatibility</li>
														</ul>
													</div>
												</div>
											</div>

											<div className='rounded-lg border border-purple-600 bg-purple-900/20 p-4'>
												<h4 className='mb-2 font-medium text-purple-200'>WBFS</h4>
												<div className='space-y-2 text-sm'>
													<div>
														<p className='font-medium text-purple-300'>Pros:</p>
														<ul className='ml-4 list-disc text-xs text-purple-100'>
															<li>Wii-specific format</li>
															<li>Compression support</li>
														</ul>
													</div>
													<div>
														<p className='font-medium text-purple-300'>Cons:</p>
														<ul className='ml-4 list-disc text-xs text-purple-100'>
															<li>Wii games only</li>
															<li>No other file storage</li>
														</ul>
													</div>
												</div>
											</div>
										</div>

										{/* FAT32 Formatting Instructions */}
										<div className='rounded-lg border border-gray-600 bg-gray-800 p-4'>
											<h4 className='mb-3 font-medium text-white'>FAT32 Formatting Process</h4>
											<ol className='ml-4 list-decimal space-y-2 text-sm text-gray-300'>
												<li>Open "This PC" or "My Computer" (<kbd className='rounded bg-gray-700 px-1'>⊞ Win+E</kbd>)</li>
												<li>Right-click your external hard drive and select "Properties"</li>
												<li>Note the Drive Letter - this is important for later steps</li>
												<li>If File-System is already FAT32, skip this formatting step</li>
												<li><strong className='text-yellow-300'>Backup any existing data</strong> - formatting will erase everything</li>
												<li>Launch FAT32 GUI Formatter from Start Menu or Desktop</li>
												<li>Carefully select the correct drive letter</li>
												<li>Optionally uncheck "Quick Format" for thorough formatting</li>
												<li>Click "Start" and wait for "Done" message</li>
											</ol>
											<p className='mt-2 text-xs text-yellow-300'>
												💡 If you get "device in use" error, close all file explorer windows and try again
											</p>
										</div>
									</div>

									{/* Step 3: Game Management Tools */}
									<div>
										<h3 className='mb-4 text-lg font-semibold text-white'>Step 3: Manage Game Backups</h3>
										
										<div className='space-y-6'>
											{/* Wii Backup Manager */}
											<div className='rounded-lg border border-gray-600 bg-gray-800 p-4'>
												<div className='mb-3 flex items-center gap-2'>
													<Gamepad2 className='h-5 w-5 text-blue-400' />
													<h4 className='font-medium text-white'>Wii Backup Manager (WBM)</h4>
												</div>
												<p className='mb-3 text-sm text-gray-300'>
													Windows program to transfer Wii games to and from hard drives and SD cards. Can download game covers, 
													list games, identify missing games between devices, and more.
												</p>
												
												<div className='mb-3'>
													<h5 className='mb-2 font-medium text-white'>Wii Game Directory Structure:</h5>
													<div className='rounded bg-gray-900 p-3 font-mono text-xs text-gray-300'>
														<div>💾 SD Card or USB Drive</div>
														<div>┗ 📂wbfs</div>
														<div>      ┣ 📂GameName [GameID]</div>
														<div>      ┃ ┗ 📜GameID.wbfs (for non-split titles)</div>
														<div>      ┗ 📂GameName [GameID]</div>
														<div>           ┣ 📜GameID.wbfs</div>
														<div>           ┗ 📜GameID.wbf1</div>
													</div>
												</div>
												<p className='text-xs text-gray-400'>
													WBM automatically splits games over 4GB for FAT32 drives and sets up proper directory structure
												</p>
											</div>

											{/* GameCube Backup Manager */}
											<div className='rounded-lg border border-gray-600 bg-gray-800 p-4'>
												<div className='mb-3 flex items-center gap-2'>
													<HardDrive className='h-5 w-5 text-purple-400' />
													<h4 className='font-medium text-white'>GameCube Backup Manager (GCBM)</h4>
												</div>
												<p className='mb-3 text-sm text-gray-300'>
													Windows program to transfer GameCube games to and from storage devices. Similar interface to 
													Wii Backup Manager for easy use.
												</p>
												
												<div className='mb-3'>
													<h5 className='mb-2 font-medium text-white'>GameCube (Nintendont) Directory Structure:</h5>
													<div className='rounded bg-gray-900 p-3 font-mono text-xs text-gray-300'>
														<div>💾 SD Card or USB Drive</div>
														<div>┗ 📂games</div>
														<div>      ┣ 📂GameName [GameID]</div>
														<div>      ┃ ┗ 📜game.ciso (for single disc)</div>
														<div>      ┗ 📂GameName [GameID]</div>
														<div>           ┣ 📜game.iso</div>
														<div>           ┗ 📜disc2.iso</div>
													</div>
												</div>
												<p className='text-xs text-gray-400'>
													Subdirectories are optional for 1-disc games in ISO/GCM and CISO format
												</p>
											</div>

											{/* NKit Processing App */}
											<div className='rounded-lg border border-gray-600 bg-gray-800 p-4'>
												<div className='mb-3 flex items-center gap-2'>
													<Archive className='h-5 w-5 text-green-400' />
													<h4 className='font-medium text-white'>NKit Processing App</h4>
												</div>
												<p className='mb-3 text-sm text-gray-300'>
													Nintendo ToolKit for recovering and preserving Wii and GameCube disc images. 
													Needed for converting NKit.iso or NKit.gcz files that WBM/GCBM cannot handle.
												</p>
												
												<div className='rounded-lg border border-yellow-600 bg-yellow-900/20 p-3'>
													<h5 className='mb-2 font-medium text-yellow-200'>How to Convert NKit Files:</h5>
													<ol className='ml-4 list-decimal space-y-1 text-sm text-yellow-100'>
														<li>Drag and drop source file(s) onto NKit Processing App window</li>
														<li>Select "Convert to ISO" Mode</li>
														<li>Click "Process"</li>
														<li>Find converted game in: ../NKit/Processed/Wii_MatchFail/</li>
													</ol>
												</div>
												<p className='mt-2 text-xs text-gray-400'>
													After converting from NKit to ISO, backups can be handled by WBM and GCBM normally
												</p>
											</div>
										</div>
									</div>

									{/* Important Notes */}
									<div className='rounded-lg border border-red-600 bg-red-900/20 p-4'>
										<h3 className='mb-3 font-medium text-red-200'>📋 Important Notes</h3>
										<ul className='ml-4 list-disc space-y-2 text-sm text-red-100'>
											<li><strong>Original Disc Ripping:</strong> Requires rare LG-branded disc drives capable of reading Wii discs</li>
											<li><strong>File Management:</strong> Use the appropriate backup manager for your game type (WBM for Wii, GCBM for GameCube)</li>
											<li><strong>Directory Structure:</strong> Proper folder structure is critical for USB loaders to recognize games</li>
											<li><strong>Format Choice:</strong> FAT32 is recommended for maximum compatibility with Wii features</li>
										</ul>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</div>
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
								<h3 className='mb-2 font-semibold text-white'>Step : Copy Homebrew Apps</h3>
								<p className='text-sm'>
									Extract the wad archive on your SD card or USB device.
								</p>
							</div>
							
							<div>
								<h3 className='mb-2 font-semibold text-white'>Step 3: Prepare USB Storage</h3>
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
