import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	const windowsIp = process.env.WINDOWS_IP || '<windows-ip>';
	let response;
	try {
		response = await fetch(`http://${windowsIp}:4000/modmii`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: await req.text(),
		});
	} catch (error) {
		return NextResponse.json({ error: 'Failed to connect to ModMii server' }, { status: 500 });
	}

	if (response.ok) {
		const data = await response.json();
		return NextResponse.json(data, { status: response.status });
	} else {
		const text = await response.text();
		return NextResponse.json({ error: text }, { status: response.status });
	}
}
