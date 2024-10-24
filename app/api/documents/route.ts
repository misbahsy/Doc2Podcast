import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cwd } from 'process';

const PROJECT_ROOT = cwd();
const UPLOAD_DIR = path.join(PROJECT_ROOT, 'uploads');

export async function GET() {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const files = fs.readdirSync(UPLOAD_DIR);
    const documents = files.map((name, id) => {
      const stats = fs.statSync(path.join(UPLOAD_DIR, name));
      return {
        id,
        name,
        status: 'completed',
        uploadedAt: stats.birthtime.toISOString(),
      };
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error in GET documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const filepath = path.join(UPLOAD_DIR, filename);
    console.log('Attempting to delete document:', filepath);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return NextResponse.json({ message: 'Document deleted successfully' });
    }
    
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  } catch (error) {
    console.error('Error in DELETE document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
