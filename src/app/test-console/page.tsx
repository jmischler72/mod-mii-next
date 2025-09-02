'use client';

// import { testModMii } from '@/actions/test-modmii';
import React, { useState } from 'react';

export default function TestConsole() {
	const [output, setOutput] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<'stdout' | 'stderr'>('stdout');
	
	// ModMii syscheck testing state
	const [syscheckCsv, setSyscheckCsv] = useState('');
	const [syscheckLoading, setSyscheckLoading] = useState(false);
	const [syscheckResult, setSyscheckResult] = useState('');

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
			setOutput(`Error running test: ${err instanceof Error ? err.message : 'Unknown error'}`);
			setError('');
		}
		setLoading(false);
	};

	const handleSyscheckTest = async () => {
		if (!syscheckCsv.trim()) {
			setSyscheckResult('Please enter syscheck CSV content');
			return;
		}

		setSyscheckLoading(true);
		setSyscheckResult('Processing syscheck...');

		try {
			const response = await fetch('/api/modmii', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ csvContent: syscheckCsv }),
			});

			if (response.ok && response.headers.get('content-type') === 'application/zip') {
				// Handle zip file download
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'modmii-files.zip';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
				setSyscheckResult(`Success! Downloaded archive with ${blob.size} bytes`);
			} else {
				const data = await response.json();
				setSyscheckResult(`Error: ${data.error || data.details || 'Unknown error'}`);
			}
		} catch (err) {
			setSyscheckResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
		}

		setSyscheckLoading(false);
	};

	const loadSampleCsv = () => {
		// Load a sample CSV content for testing
		setSyscheckCsv(`sysCheck v2.2.0 HDE by Double_A, JoostinOnline, and R2-D2199
		
System Menu 4.3U (v513) - cIOS Detection Utility
Running under IOS58 v6176

Hollywood v0x21 - Console ID: 123456789
Found 243 titles.
Installed IOSs: IOS4[65280](16+16), IOS9[65280](516+526), IOS11[256](17), IOS12[526](7), IOS13[1032](17), IOS14[1032](17), IOS15[1032](17), IOS16[512](17), IOS17[1032](17), IOS20[12](17), IOS21[1039](22), IOS22[1294](20), IOS28[1807](22), IOS30[2816](17), IOS31[3608](17), IOS33[3608](23), IOS34[3608](23), IOS35[3608](23), IOS36[3351](23), IOS37[5663](22), IOS38[4124](20), IOS41[3607](22), IOS43[3607](22), IOS45[3607](22), IOS46[3607](22), IOS48[4124](22), IOS53[5663](22), IOS55[5663](22), IOS56[5662](22), IOS57[5919](22), IOS58[6176](23), IOS60[6174](17), IOS61[5662](22), IOS62[6430](17), IOS70[6687](17), IOS80[6944](17), IOS202[65535](516+526), IOS222[65535](5+31), IOS223[65535](5+37), IOS224[65535](5+57), IOS249[65535](21+36), IOS250[65535](22+36)

Report generated on 2024-12-31.`);
	};

	return (
		<div className='p-6'>
			<h1 className='mb-4 text-2xl font-bold'>Test Console</h1>
			
			{/* Original Test Section */}
			<div className='mb-8'>
				<h2 className='mb-2 text-xl font-semibold'>Basic ModMii Test</h2>
				<button
					className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50'
					onClick={handleTest}
					disabled={loading}
				>
					{loading ? 'Running...' : 'Test ModMii Help'}
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

			{/* SysCheck Test Section */}
			<div className='mb-8'>
				<h2 className='mb-2 text-xl font-semibold'>ModMii SysCheck Processor</h2>
				<p className='mb-4 text-sm text-gray-600'>
					Upload syscheck CSV content to process and download the generated files archive.
				</p>
				
				<div className='mb-4'>
					<button
						className='mb-2 rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700'
						onClick={loadSampleCsv}
					>
						Load Sample CSV
					</button>
					<textarea
						className='w-full rounded border p-3 font-mono text-sm'
						rows={10}
						placeholder='Paste your syscheck CSV content here...'
						value={syscheckCsv}
						onChange={(e) => setSyscheckCsv(e.target.value)}
					/>
				</div>
				
				<button
					className='rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50'
					onClick={handleSyscheckTest}
					disabled={syscheckLoading || !syscheckCsv.trim()}
				>
					{syscheckLoading ? 'Processing...' : 'Process SysCheck & Download Archive'}
				</button>
				
				<div className='mt-4 min-h-[60px] rounded bg-black p-4 font-mono text-sm'>
					<span className='text-blue-400'>{syscheckResult}</span>
				</div>
			</div>
		</div>
	);
}
