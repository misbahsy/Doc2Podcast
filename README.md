# Document to Podcast - AI-Powered Audio Content Creation

Document to Podcast is an innovative AI-powered tool that transforms PDF documents into engaging podcast-style audio content. This project leverages Next.js, React, and Langflow to provide a seamless experience for generating audio content from text documents.

## Features

* PDF document upload
* AI-powered text-to-speech conversion
* Multi-speaker audio generation
* Customizable voice selection
* Interactive audio player with waveform visualization

## Getting Started

### Prerequisites

* Node.js 14.x or later
* npm or yarn
* A Langflow server running locally
* Git (for cloning the repository)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/podcast-generator.git
   cd podcast-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up Langflow:
   * Install and run the Langflow backend server
   * Navigate to the Langflow UI (usually at http://localhost:7860)
   * Import the flow provided in the repo at `langflow_flow/Doc to Podcast (Langflow).json`
   * If you need to install necessary dependecies for audio generation in Langflow, run the flow at 'langflow_flow/Doc to Podcast  (Langflow) - Necessary Installs.json`
   * Note the Flow ID after importing (you'll need this for the .env.local file)

4. Create a `.env.local` file in the root directory and add the following:
   ```
   LANGFLOW_API_URL=http://127.0.0.1:7860
   FLOW_ID=your_flow_id_here
   UPLOAD_FOLDER="uploads"
   GENERATED_AUDIO_FOLDER="generated_audio"
   ```
   Replace `your_flow_id_here` with the actual Flow ID from step 3.

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

1. Navigate to the home page.
2. Upload a PDF document.
3. Select the number of speakers and provide any additional instructions.
4. Wait for the AI to process and generate the audio content.
5. Use the interactive audio player to listen to the generated podcast.

## Project Structure

* `app/`: Contains the main application code
   * `api/`: API routes for server-side functionality
   * `components/`: Reusable React components
   * `page.tsx`: Home page component
* `public/`: Static assets
* `langflow_flow/`: Langflow configuration files
* `uploads/`: Temporary storage for uploaded files
* `generated_audio/`: Storage for AI-generated audio files

## Technologies Used

* Next.js: React framework for building the web application
* React: JavaScript library for building user interfaces
* Langflow: For AI workflow management
* Tailwind CSS: Utility-first CSS framework
* Axios: Promise-based HTTP client
* WaveSurfer.js: Audio visualization library

## Configuration

* The project uses environment variables for configuration. Ensure all necessary variables are set in your `.env.local` file.
* Tailwind CSS configuration can be found in `tailwind.config.ts`.
* TypeScript configuration is in `tsconfig.json`.

## API Routes

* `/api/upload`: Handles file upload and podcast generation

## Debugging

* Use the browser's developer tools to debug client-side issues.
* For server-side debugging, use console.log statements or attach a debugger to your Node.js process.

## Performance Considerations

* Large PDF files may take longer to process. Consider implementing a progress indicator for better user experience.
* Optimize audio file handling for improved performance with larger files.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Here are some ways you can contribute:

* Report bugs and issues
* Suggest new features
* Improve documentation
* Submit pull requests with bug fixes or new features

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

If you encounter any problems or have questions, please open an issue on the GitHub repository.

## Acknowledgements

* Thanks to the Langflow team for providing the AI workflow management tool.
* Special thanks to all contributors who have helped shape this project.
