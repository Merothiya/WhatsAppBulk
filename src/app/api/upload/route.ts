import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  // Check if token is available
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is missing in environment variables!');
    return NextResponse.json(
      { error: 'Server configuration error: Upload token missing. Please restart your dev server.' },
      { status: 500 }
    );
  }

  try {
    // Read the body as a blob to be more stable in different environments
    const blobData = await request.blob();
    
    console.log(`Uploading file: ${filename} (${blobData.size} bytes)`);

    const blob = await put(filename, blobData, {
      access: 'public',
    });

    console.log('Upload successful:', blob.url);
    return NextResponse.json(blob);
  } catch (error: any) {
    console.error('Error uploading to Vercel Blob:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    );
  }
}
