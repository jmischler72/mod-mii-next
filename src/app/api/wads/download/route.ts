import { NextRequest, NextResponse } from 'next/server';
import { getCachedWadPath } from '@/helpers/download-manager';

export async function POST(request: NextRequest) {
  try {
    const { wadnames } = await request.json();
    
    if (!wadnames || !Array.isArray(wadnames)) {
      return NextResponse.json(
        { error: 'wadnames array is required' },
        { status: 400 }
      );
    }

    // For S3-only strategy, we'll redirect to individual file URLs
    // or return a list of presigned URLs for the client to download
    const fileUrls: Array<{ name: string; url: string }> = [];
    
    for (const wadname of wadnames) {
      // Validate filename
      if (wadname.includes('..') || wadname.includes('/') || wadname.includes('\\')) {
        return NextResponse.json(
          { error: `Invalid filename: ${wadname}` },
          { status: 400 }
        );
      }

      const cachedInfo = await getCachedWadPath(wadname);
      if (!cachedInfo || !cachedInfo.s3Url) {
        return NextResponse.json(
          { error: `WAD file not found in S3: ${wadname}` },
          { status: 404 }
        );
      }

      fileUrls.push({
        name: wadname,
        url: cachedInfo.s3Url
      });
    }

    // Return the list of download URLs
    return NextResponse.json({
      success: true,
      message: `Found ${fileUrls.length} files in S3`,
      files: fileUrls
    });

  } catch (error) {
    console.error('Error preparing downloads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
