import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, ExternalLink } from 'lucide-react';

export function DatabaseInfoDialog() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant='outline'
					size='sm'
					className='border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
				>
					<Info className='mr-2 h-4 w-4' />
					Where does this data come from?
				</Button>
			</DialogTrigger>
			<DialogContent className='max-w-2xl'>
				<DialogHeader>
					<DialogTitle>About the Database</DialogTitle>
					<DialogDescription>Learn about how this database is created and maintained</DialogDescription>
				</DialogHeader>
				<div className='space-y-4 text-sm text-gray-300'>
					<div>
						<h3 className='mb-2 font-semibold text-white'>Source</h3>
						<p>
							This database is automatically generated from the original ModMii batch files that contain the WAD
							information. The data comes from the official ModMii toolkit created by XFlak.
						</p>
					</div>

					<div>
						<h3 className='mb-2 font-semibold text-white'>Generation Process</h3>
						<ol className='list-decimal space-y-1 pl-5'>
							<li>
								The original <code className='rounded bg-gray-700 px-1'>DB.bat</code> file from ModMii is parsed to
								extract WAD definitions
							</li>
							<li>Each SET command is analyzed to build individual database entries</li>
							<li>Variables are resolved and entries are automatically categorized (iOS, OSC, cIOS, d2x)</li>
							<li>The final database is exported as a JSON file for web consumption</li>
						</ol>
					</div>

					<div>
						<h3 className='mb-2 font-semibold text-white'>Entry Types</h3>
						<div className='space-y-2'>
							<div className='flex items-center space-x-2'>
								<span className='rounded-full bg-blue-600 px-2 py-1 text-xs text-blue-100'>IOS</span>
								<span>Standard Nintendo Internet Channel and other iOS</span>
							</div>
							<div className='flex items-center space-x-2'>
								<span className='rounded-full bg-green-600 px-2 py-1 text-xs text-green-100'>OSC</span>
								<span>Open Shop Channel applications and homebrew</span>
							</div>
							<div className='flex items-center space-x-2'>
								<span className='rounded-full bg-purple-600 px-2 py-1 text-xs text-purple-100'>CIOS</span>
								<span>Custom iOS for homebrew compatibility</span>
							</div>
							<div className='flex items-center space-x-2'>
								<span className='rounded-full bg-orange-600 px-2 py-1 text-xs text-orange-100'>D2X</span>
								<span>d2x cIOS variants for enhanced functionality</span>
							</div>
						</div>
					</div>

					<div>
						<h3 className='mb-2 font-semibold text-white'>Data Fields</h3>
						<div className='grid grid-cols-2 gap-2 text-xs'>
							<div>
								<strong>ID:</strong> Unique identifier
							</div>
							<div>
								<strong>Name:</strong> Human-readable title
							</div>
							<div>
								<strong>Code1/Code2:</strong> Nintendo title IDs
							</div>
							<div>
								<strong>Version:</strong> Software version
							</div>
							<div>
								<strong>WAD Name:</strong> Filename of the WAD
							</div>
							<div>
								<strong>MD5:</strong> File checksum for verification
							</div>
							<div>
								<strong>cIOS Slot:</strong> Installation slot (cIOS only)
							</div>
							<div>
								<strong>cIOS Version:</strong> Base iOS version (cIOS only)
							</div>
						</div>
					</div>

					<div>
						<h3 className='mb-2 font-semibold text-white'>Updates</h3>
						<p>
							The database is updated whenever new entries are added to the ModMii toolkit. The conversion script
							automatically processes changes and maintains backward compatibility.
						</p>
					</div>

					<div className='rounded-lg border border-yellow-600 bg-yellow-900/20 p-3'>
						<div className='flex items-start space-x-2'>
							<Info className='mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400' />
							<div>
								<p className='text-sm text-yellow-200'>
									<strong>Note:</strong> This is an unofficial web interface. For the official ModMii toolkit and latest
									updates, visit the original project.
								</p>
								<a
									href='https://modmii.github.io/'
									target='_blank'
									rel='noopener noreferrer'
									className='mt-1 inline-flex items-center text-xs text-yellow-300 underline hover:text-yellow-100'
								>
									Visit ModMii on GitHub
									<ExternalLink className='ml-1 h-3 w-3' />
								</a>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
