import { initializeS3 } from '@/helpers/s3-storage';

/**
 * Initialize S3 connection on app startup
 * Call this in your main application startup
 */
export async function initializeStorage(): Promise<void> {
  console.log('Initializing S3 storage...');
  
  try {
    await initializeS3();
    console.log('✅ S3 storage initialized successfully');
  } catch (error) {
    console.warn('⚠️ S3 storage initialization failed:', error);
    console.warn('Files will only be available if already cached in S3');
  }
}

// You can call this in your main layout or app startup
if (typeof window === 'undefined') {
  // Only run on server side
  initializeStorage().catch(console.error);
}
