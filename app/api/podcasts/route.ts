import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cwd } from 'process';

const PROJECT_ROOT = cwd();
const GENERATED_AUDIO_DIR = path.join(PROJECT_ROOT, 'generated_audio');

export async function GET() {
  try {
    if (!fs.existsSync(GENERATED_AUDIO_DIR)) {
      fs.mkdirSync(GENERATED_AUDIO_DIR, { recursive: true });
    }

    const files = fs.readdirSync(GENERATED_AUDIO_DIR);
    const podcasts = files.map((name, id) => ({
      id,
      name,
    }));

    return NextResponse.json(podcasts);
  } catch (error) {
    console.error('Error in GET podcasts:', error);
    return NextResponse.json({ error: 'Failed to fetch podcasts' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const filepath = path.join(GENERATED_AUDIO_DIR, filename);
    console.log('Attempting to delete podcast:', filepath);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return NextResponse.json({ message: 'Podcast deleted successfully' });
    }
    
    return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
  } catch (error) {
    console.error('Error in DELETE podcast:', error);
    return NextResponse.json({ error: 'Failed to delete podcast' }, { status: 500 });
  }
}
