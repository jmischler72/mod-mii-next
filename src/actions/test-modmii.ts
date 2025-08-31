'use server';

import { syscheckAnalysis } from '@/helpers/modmii-wrapper';

export async function testModMii() {
	return await syscheckAnalysis();
}
