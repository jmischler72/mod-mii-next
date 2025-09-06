'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { DatabaseEntry, DatabaseData } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useDownload } from '@/hooks/use-download';
import { isDownloadableCategory, getCategoryColors } from '@/utils/database-utils';

export default function EntryDetailPage() {
	const { toast } = useToast();
	const { downloadFile, isDownloading } = useDownload();
	const params = useParams();
	const router = useRouter();
	const entryId = decodeURIComponent(params.id as string);

	const [entry, setEntry] = useState<DatabaseEntry | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [copiedField, setCopiedField] = useState<string>('');

	useEffect(() => {
		const loadEntry = async () => {
			try {
				const response = await fetch('/database.json');
				if (!response.ok) {
					throw new Error('Failed to load database');
				}
				const data: DatabaseData = await response.json();
				const entryData = data.entries[entryId];

				if (!entryData) {
					setError('Entry not found');
				} else {
					setEntry(entryData);
				}
				setLoading(false);
			} catch (err) {
				setError('Failed to load entry');
				setLoading(false);
			}
		};

		if (entryId) {
			loadEntry();
		}
	}, [entryId]);

	const copyToClipboard = async (text: string, fieldName: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(fieldName);
			setTimeout(() => setCopiedField(''), 2000);
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
		}
	};

	if (loading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-black text-white'>
				<div className='text-center'>
					<div className='mx-auto mb-4 h-32 w-32 animate-spin rounded-full border-b-2 border-white'></div>
					<p className='text-lg'>Loading entry...</p>
				</div>
			</div>
		);
	}

	if (error || !entry) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-black text-white'>
				<div className='text-center'>
					<p className='mb-4 text-lg text-red-400'>{error || 'Entry not found'}</p>
					<Link href='/browse'>
						<Button variant='outline' className='border-white text-white hover:bg-white hover:text-black'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Browse
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	const renderField = (label: string, value: string | number, fieldKey: string, copyable = false) => (
		<div className='flex items-center justify-between border-b border-gray-700 py-3 last:border-b-0'>
			<div className='flex-1'>
				<span className='text-sm text-gray-400'>{label}</span>
				<p className='mt-1 font-mono text-sm break-all text-white'>{value}</p>
			</div>
			{copyable && (
				<Button
					variant='ghost'
					size='sm'
					onClick={() => copyToClipboard(value.toString(), fieldKey)}
					className='ml-2 text-gray-400 hover:text-white'
				>
					{copiedField === fieldKey ? <Check className='h-4 w-4 text-green-400' /> : <Copy className='h-4 w-4' />}
				</Button>
			)}
		</div>
	);

	return (
		<div className='min-h-screen bg-black text-white'>
			<div className='container mx-auto px-4 py-8'>
				{/* Header */}
				<div className='mb-8'>
					<Link href='/browse'>
						<Button variant='ghost' className='mb-4 text-white hover:bg-gray-800'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Browse
						</Button>
					</Link>

					<div className='flex items-start justify-between'>
						<div>
							<h1 className='mb-2 text-4xl font-bold'>{entry.name}</h1>
							<p className='text-lg text-gray-400'>
								Entry ID: <span className='font-mono'>{entryId}</span>
							</p>
						</div>
						{entry.category && (
							<span
								className={`rounded-full px-3 py-1 text-sm ${getCategoryColors(entry.category).bg} ${getCategoryColors(entry.category).text}`}
							>
								{entry.category.toUpperCase()}
							</span>
						)}
					</div>
				</div>

				<div className='grid gap-8 lg:grid-cols-2'>
					{/* Main Details */}
					<div className='rounded-lg border border-gray-700 bg-gray-800 p-6'>
						<h2 className='mb-4 text-xl font-semibold text-white'>Entry Details</h2>
						<div className='space-y-0'>
							{renderField('Entry ID', entryId, 'id', true)}
							{renderField('Name', entry.name, 'name', true)}
							{renderField('Code 1', entry.code1, 'code1', true)}
							{entry.code2 && renderField('Code 2', entry.code2, 'code2', true)}
							{renderField('Version', entry.version, 'version', true)}
							{entry.category && renderField('Category', entry.category, 'category')}
						</div>
					</div>

					{/* File Information */}
					<div className='rounded-lg border border-gray-700 bg-gray-800 p-6'>
						<h2 className='mb-4 text-xl font-semibold text-white'>File Information</h2>
						<div className='space-y-0'>
							{renderField('WAD Name', entry.wadname, 'wadname', true)}
							{entry.dlname && renderField('Download Name', entry.dlname, 'dlname', true)}
							{entry.filename && renderField('Filename', entry.filename, 'filename', true)}
						</div>
					</div>

					{/* Hash Information */}
					<div className='rounded-lg border border-gray-700 bg-gray-800 p-6'>
						<h2 className='mb-4 text-xl font-semibold text-white'>Hash Information</h2>
						<div className='space-y-0'>
							{renderField('MD5', entry.md5, 'md5', true)}
							{entry.md5alt && renderField('MD5 Alt', entry.md5alt, 'md5alt', true)}
							{entry.md5base && renderField('MD5 Base', entry.md5base, 'md5base', true)}
							{entry.md5basealt && renderField('MD5 Base Alt', entry.md5basealt, 'md5basealt', true)}
						</div>
					</div>

					{/* cIOS Information (if applicable) */}
					{(entry.ciosslot || entry.ciosversion || entry.basewad) && (
						<div className='rounded-lg border border-gray-700 bg-gray-800 p-6'>
							<h2 className='mb-4 text-xl font-semibold text-white'>cIOS Information</h2>
							<div className='space-y-0'>
								{entry.ciosslot && renderField('cIOS Slot', entry.ciosslot, 'ciosslot', true)}
								{entry.ciosversion && renderField('cIOS Version', entry.ciosversion, 'ciosversion', true)}
								{entry.basewad && renderField('Base WAD', entry.basewad, 'basewad', true)}
							</div>
						</div>
					)}
				</div>

				{/* Download Section */}
				{isDownloadableCategory(entry.category) && (
					<div className='mt-8 rounded-lg border border-gray-700 bg-gray-800 p-6'>
						<h2 className='mb-4 text-xl font-semibold text-white'>Download</h2>
						<p className='mb-4 text-gray-400'>Download this entry to use with your Wii homebrew setup.</p>
						<Button
							onClick={() => downloadFile(entryId, entry.wadname)}
							disabled={isDownloading(entryId)}
							className='bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
						>
							<Download className='mr-2 h-4 w-4' />
							{isDownloading(entryId) ? 'Downloading...' : `Download ${entry.wadname}`}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
