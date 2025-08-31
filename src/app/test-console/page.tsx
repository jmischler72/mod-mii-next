'use client';

// import { testModMii } from '@/actions/test-modmii';
import React, { useState } from 'react';

export default function TestConsole() {
	const [output, setOutput] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<'stdout' | 'stderr'>('stdout');

	const handleTest = async () => {
		setLoading(true);
		setOutput('');
		setError('');
		try {
			const response = await fetch('/api/test-console', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ exe: 'wine', args: ['/modmii/Support/ModMii.bat', '-h'] }),
			});
			const data = await response.json();
			setOutput(data.stdout || 'No output');
			setError(data.stderr || 'No error');
			if (data.error) setOutput(data.error);
		} catch (err) {
			setOutput('Error running test');
			setError('');
		}
		setLoading(false);
	};

	return (
		<div className='p-6'>
			<h1 className='mb-4 text-2xl font-bold'>Test Console</h1>
			<button
				className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50'
				onClick={handleTest}
				disabled={loading}
			>
				{loading ? 'Running...' : 'Test'}
			</button>
			<div className='mt-6 flex space-x-2'>
				<button
					className={`rounded-t px-4 py-2 ${activeTab === 'stdout' ? 'bg-gray-800 text-green-400' : 'bg-gray-700 text-white'}`}
					onClick={() => setActiveTab('stdout')}
				>
					Stdout
				</button>
				<button
					className={`rounded-t px-4 py-2 ${activeTab === 'stderr' ? 'bg-gray-800 text-red-400' : 'bg-gray-700 text-white'}`}
					onClick={() => setActiveTab('stderr')}
				>
					Stderr
				</button>
			</div>
			<div className='min-h-[120px] rounded-tr-none rounded-b bg-black p-4 font-mono whitespace-pre-wrap'>
				{activeTab === 'stdout' ? (
					<span className='text-green-400'>{output}</span>
				) : (
					<span className='text-red-400'>{error}</span>
				)}
			</div>
		</div>
	);
}
