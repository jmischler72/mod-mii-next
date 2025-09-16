'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Info, Home } from 'lucide-react';

export function Navbar() {
	return (
		<nav className='border-b border-gray-700 bg-gray-900'>
			<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
				<div className='flex h-16 items-center justify-between'>
					{/* Logo/Brand */}
					<div className='flex items-center'>
						<Link href='/' className='flex items-center space-x-2'>
							<div className='flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-purple-600'>
								<span className='text-sm font-bold text-white'>M</span>
							</div>
							<span className='text-xl font-bold text-white'>ModMiiNext</span>
						</Link>
					</div>

					{/* Navigation Links */}
					<div className='flex items-center space-x-4'>
						<Link href='/'>
							<Button variant='ghost' className='text-white hover:bg-gray-800 hover:text-white'>
								Home
							</Button>
						</Link>
						<Link href='/syscheck'>
							<Button variant='ghost' className='text-white hover:bg-gray-800 hover:text-white'>
								Syscheck
							</Button>
						</Link>
						<Link href='/usb-loader'>
							<Button variant='ghost' className='text-white hover:bg-gray-800 hover:text-white'>
								USB Loader
							</Button>
						</Link>
						<Link href='/browse'>
							<Button variant='ghost' className='text-white hover:bg-gray-800 hover:text-white'>
								Browse Database
							</Button>
						</Link>
						<Link href='/about'>
							<Button variant='outline' size='sm' className='border-white text-white hover:bg-white hover:text-black'>
								<Info className='mr-1 h-4 w-4' />
								About
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</nav>
	);
}
