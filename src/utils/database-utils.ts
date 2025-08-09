/**
 * Helper functions for database entries
 */

/**
 * Check if a category supports downloading
 */
export function isDownloadableCategory(category: string | undefined): boolean {
	if (!category) return false;
	return ['ios', 'd2x', 'osc'].includes(category.toLowerCase());
}

/**
 * Get the color classes for a category
 */
export function getCategoryColors(category: string | undefined): { bg: string; text: string } {
	if (!category) return { bg: 'bg-gray-600', text: 'text-gray-100' };

	switch (category.toLowerCase()) {
		case 'ios':
			return { bg: 'bg-blue-600', text: 'text-blue-100' };
		case 'osc':
			return { bg: 'bg-green-600', text: 'text-green-100' };
		case 'cios':
			return { bg: 'bg-purple-600', text: 'text-purple-100' };
		case 'd2x':
			return { bg: 'bg-orange-600', text: 'text-orange-100' };
		case 'patchios':
			return { bg: 'bg-indigo-600', text: 'text-indigo-100' };
		default:
			return { bg: 'bg-gray-600', text: 'text-gray-100' };
	}
}
