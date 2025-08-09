'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, Filter, Eye } from 'lucide-react';
import Link from 'next/link';
import { DatabaseEntry, DatabaseData } from '@/types/database';
import { DatabaseInfoDialog } from '@/components/database-info-dialog';
import { useToast } from '@/hooks/use-toast';
import { useDownload } from '@/hooks/use-download';
import { isDownloadableCategory } from '@/utils/database-utils';
import { Toaster } from '@/components/ui/toaster';

export default function BrowsePage() {
	const { toast } = useToast();
	const { downloadFile, isDownloading } = useDownload();
	const [database, setDatabase] = useState<DatabaseData | null>(null);
	const [filteredEntries, setFilteredEntries] = useState<Array<DatabaseEntry & { id: string }>>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(24);

	useEffect(() => {
		const loadDatabase = async () => {
			try {
				const response = await fetch('/database.json');
				if (!response.ok) {
					throw new Error('Failed to load database');
				}
				const data: DatabaseData = await response.json();
				setDatabase(data);
				setLoading(false);
			} catch (err) {
				setError('Failed to load database');
				setLoading(false);
			}
		};

		loadDatabase();
	}, []);

	useEffect(() => {
		if (!database) return;

		let entries = Object.entries(database.entries).map(([id, entry]) => ({
			...entry,
			id,
		}));

		// Filter by category
		if (selectedCategory !== 'all') {
			entries = entries.filter((entry) => entry.category === selectedCategory);
		}

		// Filter by search term
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			entries = entries.filter(
				(entry) =>
					(entry.name && entry.name.toLowerCase().includes(term)) ||
					(entry.id && entry.id.toLowerCase().includes(term)) ||
					(entry.wadname && entry.wadname.toLowerCase().includes(term)) ||
					(entry.code1 && entry.code1.toLowerCase().includes(term)) ||
					(entry.code2 && entry.code2.toLowerCase().includes(term)),
			);
		}

		setFilteredEntries(entries);
		setCurrentPage(1); // Reset to first page when filters change
	}, [database, searchTerm, selectedCategory]);

	const getUniqueCategories = () => {
		if (!database) return [];
		const categories = new Set(
			Object.values(database.entries)
				.map((entry) => entry.category)
				.filter(Boolean),
		);
		return Array.from(categories).sort();
	};

	// Pagination calculations
	const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentEntries = filteredEntries.slice(startIndex, endIndex);

	const goToPage = (page: number) => {
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	if (loading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-black text-white'>
				<Toaster />
				<div className='text-center'>
					<div className='mx-auto mb-4 h-32 w-32 animate-spin rounded-full border-b-2 border-white'></div>
					<p className='text-lg'>Loading database...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-black text-white'>
				<Toaster />
				<div className='max-w-md text-center'>
					<div className='mb-4 text-6xl'>⚠️</div>
					<h1 className='mb-4 text-2xl font-bold text-red-400'>Database Error</h1>
					<p className='mb-6 text-gray-300'>{error}</p>
					<Button onClick={() => window.location.reload()} className='bg-blue-600 text-white hover:bg-blue-700'>
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-black text-white'>
			<Toaster />
			<div className='container mx-auto px-4 py-8'>
				{/* Header */}
				<div className='mb-8'>
					<div className='flex items-start justify-between'>
						<div>
							<h1 className='mb-2 text-4xl font-bold'>Browse Database</h1>
							<p className='text-gray-400'>
								Browse and search through {Object.keys(database?.entries || {}).length} database entries
							</p>
							{database?.meta && (
								<p className='mt-2 text-sm text-gray-500'>
									Database version: {database.meta.DBversion} | Last updated:{' '}
									{new Date(database.meta.converted).toLocaleDateString()}
								</p>
							)}
						</div>
						<div className='flex-shrink-0'>
							<DatabaseInfoDialog />
						</div>
					</div>
				</div>

				{/* Filters and Search */}
				<div className='mb-6 space-y-4 md:flex md:items-center md:space-y-0 md:space-x-6'>
					<div className='relative flex-1'>
						<Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
						<Input
							type='text'
							placeholder='Search by name, ID, wadname, or code...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className='border-gray-700 bg-gray-800 pl-10 text-white placeholder-gray-400'
						/>
					</div>
					<div className='flex items-center space-x-2'>
						<Filter className='h-4 w-4 text-gray-400' />
						<select
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value)}
							className='rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white'
						>
							<option value='all'>All Categories</option>
							{getUniqueCategories().map((category) => (
								<option key={category} value={category}>
									{category?.toUpperCase()}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Results Count */}
				<div className='mb-4 flex items-center justify-between'>
					<p className='text-gray-400'>
						Showing {startIndex + 1}-{Math.min(endIndex, filteredEntries.length)} of {filteredEntries.length} entries
						{filteredEntries.length !== Object.keys(database?.entries || {}).length &&
							` (filtered from ${Object.keys(database?.entries || {}).length} total)`}
					</p>
					{totalPages > 1 && (
						<div className='text-sm text-gray-400'>
							Page {currentPage} of {totalPages}
						</div>
					)}
				</div>

				{/* Entries Grid */}
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{currentEntries.map((entry) => (
						<div
							key={entry.id}
							className='rounded-lg border border-gray-700 bg-gray-800 p-6 transition-colors hover:border-gray-600'
						>
							<div className='mb-3 flex items-start justify-between'>
								<h3 className='truncate text-lg font-semibold text-white'>{entry.name}</h3>
								{entry.category && (
									<span
										className={`rounded-full px-2 py-1 text-xs ${
											entry.category === 'ios'
												? 'bg-blue-600 text-blue-100'
												: entry.category === 'OSC'
													? 'bg-green-600 text-green-100'
													: entry.category === 'cios'
														? 'bg-purple-600 text-purple-100'
														: entry.category === 'd2x'
															? 'bg-orange-600 text-orange-100'
															: 'bg-gray-600 text-gray-100'
										}`}
									>
										{entry.category.toUpperCase()}
									</span>
								)}
							</div>

							<div className='space-y-2 overflow-hidden text-sm text-gray-300'>
								<div>
									<span className='text-gray-400'>ID:</span> <span className='font-mono'>{entry.id}</span>
								</div>
								<div>
									<span className='text-gray-400'>Code1:</span> <span className='font-mono'>{entry.code1}</span>
								</div>
								{entry.code2 && (
									<div>
										<span className='text-gray-400'>Code2:</span> <span className='font-mono'>{entry.code2}</span>
									</div>
								)}
								<div>
									<span className='text-gray-400'>Version:</span> <span>{entry.version}</span>
								</div>
								<div>
									<span className='text-gray-400'>WAD Name:</span>{' '}
									<span className='font-mono text-xs'>{entry.wadname}</span>
								</div>
								{entry.dlname && (
									<div>
										<span className='text-gray-400'>Download Name:</span>{' '}
										<span className='font-mono text-xs'>{entry.dlname}</span>
									</div>
								)}
								<div>
									<span className='text-gray-400'>MD5:</span> <span className='font-mono text-xs'>{entry.md5}</span>
								</div>
								{entry.ciosslot && (
									<div>
										<span className='text-gray-400'>cIOS Slot:</span> <span>{entry.ciosslot}</span>
									</div>
								)}
								{entry.ciosversion && (
									<div>
										<span className='text-gray-400'>cIOS Version:</span> <span>{entry.ciosversion}</span>
									</div>
								)}
							</div>

							<div className='mt-4 flex space-x-2 border-t border-gray-700 pt-4'>
								<Link href={`/browse/${encodeURIComponent(entry.id)}`} className='flex-1'>
									<Button
										size='sm'
										variant='outline'
										className='w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
									>
										<Eye className='mr-2 h-4 w-4' />
										View Details
									</Button>
								</Link>
								{isDownloadableCategory(entry.category) && (
									<Button
										size='sm'
										onClick={() => downloadFile(entry.id, entry.wadname)}
										disabled={isDownloading(entry.id)}
										className='flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
									>
										<Download className='mr-2 h-4 w-4' />
										{isDownloading(entry.id) ? 'Downloading...' : 'Download'}
									</Button>
								)}
							</div>
						</div>
					))}
				</div>

				{/* No results message */}
				{filteredEntries.length === 0 && (
					<div className='py-12 text-center'>
						<p className='text-lg text-gray-400'>No entries found matching your search criteria.</p>
					</div>
				)}

				{/* Pagination */}
				{totalPages > 1 && (
					<div className='mt-8 flex items-center justify-center space-x-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => goToPage(currentPage - 1)}
							disabled={currentPage === 1}
							className='border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50'
						>
							Previous
						</Button>

						{/* Page numbers */}
						<div className='flex space-x-1'>
							{[...Array(Math.min(5, totalPages))].map((_, i) => {
								let pageNum;
								if (totalPages <= 5) {
									pageNum = i + 1;
								} else if (currentPage <= 3) {
									pageNum = i + 1;
								} else if (currentPage >= totalPages - 2) {
									pageNum = totalPages - 4 + i;
								} else {
									pageNum = currentPage - 2 + i;
								}

								return (
									<Button
										key={pageNum}
										variant={currentPage === pageNum ? 'default' : 'outline'}
										size='sm'
										onClick={() => goToPage(pageNum)}
										className={
											currentPage === pageNum
												? 'bg-blue-600 text-white'
												: 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
										}
									>
										{pageNum}
									</Button>
								);
							})}
						</div>

						<Button
							variant='outline'
							size='sm'
							onClick={() => goToPage(currentPage + 1)}
							disabled={currentPage === totalPages}
							className='border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50'
						>
							Next
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
