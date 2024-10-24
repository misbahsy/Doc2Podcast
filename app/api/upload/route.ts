import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { cwd } from 'process';

// Use absolute paths based on project root
const PROJECT_ROOT = cwd();
const UPLOAD_DIR = path.join(PROJECT_ROOT, 'uploads');
const GENERATED_AUDIO_DIR = path.join(PROJECT_ROOT, 'generated_audio');
// const ALLOWED_EXTENSIONS = new Set(['txt', 'pdf', 'doc', 'docx']);

console.log('Project root:', PROJECT_ROOT);
console.log('Upload directory:', UPLOAD_DIR);
console.log('Generated audio directory:', GENERATED_AUDIO_DIR);

// Ensure directories exist
[UPLOAD_DIR, GENERATED_AUDIO_DIR].forEach(dir => {
  console.log('Checking directory exists:', dir);
  if (!fs.existsSync(dir)) {
    console.log('Creating directory:', dir);
    fs.mkdirSync(dir, { recursive: true });
  }
});

class LangflowClient {
  private baseUrl: string;
  private flowId: string;

  constructor() {
    this.baseUrl = process.env.LANGFLOW_API_URL || 'http://127.0.0.1:7860';
    this.flowId = process.env.FLOW_ID || 'dd72b172-291b-4081-b96b-48aace78d07c';
    console.log('LangflowClient initialized with baseUrl:', this.baseUrl);
    console.log('Using flowId:', this.flowId);
  }

  async generatePodcast(filePath: string, numSpeakers: number, instructions: string) {
    // Use absolute path for the file
    const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.join(PROJECT_ROOT, filePath);
    console.log('Absolute file path:', absoluteFilePath);

    const tweaks = {
      "MergeDataComponent-VsFMU": {},
      "File-cdlzI": {
        "path": absoluteFilePath,
        "silent_errors": true
      },
      "Prompt-1dBUo": {
        "number_of_speakers": String(numSpeakers),
        // "user_request": instructions
      },
      "MarkdownDataExtractorComponent-LfWlk": {
        "block_type": "csv"
      },
    //   "TextInput-RpLEi": {
    //     "input_value": instructions // This will now receive the formatted string
    //   },
      "ChatInput-Vp1zb": {
        "input_value": instructions
      },
      "MultiSpeakerAudioGenerator-Qke3H": {
        "filepath": path.join(GENERATED_AUDIO_DIR, `audio_${path.parse(filePath).name}`)
      }
    };

    console.log('Tweaks configuration:', JSON.stringify(tweaks, null, 2));

    const payload = {
      "input_type": "text",
      "output_type": "text",
      "tweaks": tweaks
    };

    console.log('Sending payload to Langflow:', JSON.stringify(payload, null, 2));

    try {
      console.log('Making POST request to Langflow API...');
      const response = await axios.post(
        `${this.baseUrl}/api/v1/run/${this.flowId}`,
        payload,
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      console.log('Langflow API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in generatePodcast:', error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: 'Unknown error occurred' };
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('Handling POST request...');
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const speakers = formData.get('speakers');
    const instructions = formData.get('instructions');

    console.log('Received form data:');
    console.log('- File name:', file?.name);
    console.log('- Speakers:', speakers);
    console.log('- Instructions:', instructions);
    if (!file) {
      console.log('No file uploaded');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Generate unique filename
    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    console.log('Generated filepath:', filepath);

    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      console.log('Creating uploads directory:', UPLOAD_DIR);
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filepath, buffer);

    // Initialize LangflowClient and generate podcast
    const langflow = new LangflowClient();
    const result = await langflow.generatePodcast(
      filepath,
      speakers ? speakers.toString().split(',').length : 1,
      instructions?.toString() || ''
    );

    console.log('File successfully saved and processed');
    return NextResponse.json({ filename, result });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
