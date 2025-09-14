import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Usb, ArrowRight } from 'lucide-react';

export default function Home() {
	return (
		<div className='mt-8 min-h-screen bg-black p-4 font-sans sm:p-6'>
			<main className='mx-auto max-w-4xl'>
				{/* Hero Section */}
				<div className='mb-12 text-center'>
					<h1 className='mb-4 text-4xl font-bold text-white sm:text-5xl'>
						ModMii<span className='text-blue-400'>Next</span>
					</h1>
					<p className='mx-auto max-w-2xl text-lg text-gray-300'>
						The next generation of ModMii tools. Modernize your Wii console with essential homebrew applications, system
						updates, and USB loaders.
					</p>
				</div>

				{/* Feature Cards */}
				<div className='grid gap-6 md:grid-cols-2'>
					{/* Syscheck Card */}
					<Link href='/syscheck'>
						<div className='group cursor-pointer rounded-lg border border-gray-700 bg-gray-900 p-8 transition-all hover:border-blue-500 hover:bg-gray-800'>
							<div className='mb-4 flex items-center gap-3'>
								<div className='rounded-full bg-blue-600 p-3'>
									<FileText className='h-6 w-6 text-white' />
								</div>
								<h2 className='text-2xl font-bold text-white'>Syscheck Analysis</h2>
							</div>

							<p className='mb-6 text-gray-300'>
								Upload your syscheck.csv file to analyze your Wii console's configuration and get personalized
								recommendations for system updates and missing components.
							</p>

							<div className='mb-6 space-y-2'>
								<h3 className='font-semibold text-white'>Features:</h3>
								<ul className='space-y-1 text-sm text-gray-400'>
									<li>• Analyze system configuration</li>
									<li>• Detect missing IOS and cIOS</li>
									<li>• Check homebrew installation status</li>
									<li>• Download required WAD files</li>
								</ul>
							</div>

							<div className='flex items-center justify-between'>
								<span className='text-sm text-gray-400'>Upload syscheck.csv file</span>
								<ArrowRight className='h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1' />
							</div>
						</div>
					</Link>

					{/* USB Loader Card */}
					<Link href='/usb-loader'>
						<div className='group cursor-pointer rounded-lg border border-gray-700 bg-gray-900 p-8 transition-all hover:border-green-500 hover:bg-gray-800'>
							<div className='mb-4 flex items-center gap-3'>
								<div className='rounded-full bg-green-600 p-3'>
									<Usb className='h-6 w-6 text-white' />
								</div>
								<h2 className='text-2xl font-bold text-white'>USB Loader Setup</h2>
							</div>

							<p className='mb-6 text-gray-300'>
								Choose and install a USB loader for your Wii console. Get all the necessary files and step-by-step
								installation instructions.
							</p>

							<div className='mb-6 space-y-2'>
								<h3 className='font-semibold text-white'>Available Loaders:</h3>
								<ul className='space-y-1 text-sm text-gray-400'>
									<li>• USB Loader GX</li>
									<li>• Configurable USB Loader</li>
									<li>• WiiFlow</li>
									<li>• Complete installation packages</li>
								</ul>
							</div>

							<div className='flex items-center justify-between'>
								<span className='text-sm text-gray-400'>Choose your loader</span>
								<ArrowRight className='h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1' />
							</div>
						</div>
					</Link>
				</div>

				{/* Additional Information */}
				<div className='mt-12 rounded-lg border border-gray-700 bg-gray-900 p-6'>
					<h3 className='mb-4 text-xl font-bold text-white'>Getting Started</h3>
					<div className='grid gap-4 md:grid-cols-2'>
						<div>
							<h4 className='mb-2 font-semibold text-white'>Prerequisites</h4>
							<ul className='space-y-1 text-sm text-gray-300'>
								<li>• Wii console with homebrew capability</li>
								<li>• SD card (2GB or smaller recommended)</li>
								<li>• USB storage device (for loaders)</li>
								<li>• Computer with internet access</li>
							</ul>
						</div>
						<div>
							<h4 className='mb-2 font-semibold text-white'>Safety First</h4>
							<ul className='space-y-1 text-sm text-gray-300'>
								<li>• Always backup your NAND before modifications</li>
								<li>• Use Priiloader for additional protection</li>
								<li>• Follow installation guides carefully</li>
								<li>• Keep your console's power connected</li>
							</ul>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
