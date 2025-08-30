'use server';

import { syscheckAnalysis } from '@/helpers/modmii-wrapper';

export async function testModMii() {
	await syscheckAnalysis();
}
