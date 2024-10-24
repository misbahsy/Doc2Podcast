import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const GENERATED_AUDIO_DIR = process.env.GENERATED_AUDIO_FOLDER || 'generated_audio';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Await the params to properly handle dynamic route parameters
    const { filename } = await params;
    const filepath = path.join(GENERATED_AUDIO_DIR, filename);

    // Use async fs operations
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = await fs.promises.readFile(filepath);
    const response = new NextResponse(file);
    
    response.headers.set('Content-Type', 'audio/mpeg');
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
