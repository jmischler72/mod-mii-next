import { NextRequest, NextResponse } from 'next/server';
import { getCachedWadPath } from '@/helpers/download-manager';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wadname = searchParams.get('wadname');
    
    if (!wadname) {
      return NextResponse.json(
        { error: 'WAD filename is required' },
        { status: 400 }
      );
    }

    // Validate filename to prevent path traversal
    if (wadname.includes('..') || wadname.includes('/') || wadname.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Check if file exists in S3
    const cachedInfo = await getCachedWadPath(wadname);
    
    if (!cachedInfo || !cachedInfo.s3Url) {
      return NextResponse.json(
        { error: 'WAD file not found in S3' },
        { status: 404 }
      );
    }

    // Redirect to presigned S3 URL
    return NextResponse.redirect(cachedInfo.s3Url);

  } catch (error) {
    console.error('Error serving WAD file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Handle POST requests to trigger downloads
export async function POST(request: NextRequest) {
  try {
    const { wadIds } = await request.json();
    
    if (!wadIds || !Array.isArray(wadIds)) {
      return NextResponse.json(
        { error: 'wadIds array is required' },
        { status: 400 }
      );
    }

    // Import here to avoid issues with server-side rendering
    const { downloadMultipleWads } = await import('@/helpers/download-manager');
    
    const downloadSummary = await downloadMultipleWads(wadIds, {
      maxConcurrent: 2
    });

    return NextResponse.json({
      success: true,
      summary: downloadSummary
    });

  } catch (error) {
    console.error('Error downloading WADs:', error);
    return NextResponse.json(
      { error: 'Failed to download WADs' },
      { status: 500 }
    );
  }
}
