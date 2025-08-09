/**
 * Helper functions for database entries
 */

/**
 * Check if a category supports downloading
 */
export function isDownloadableCategory(category: string | undefined): boolean {
	if (!category) return false;
	return ['ios', 'd2x', 'OSC', 'patchios'].includes(category.toLowerCase());
}
