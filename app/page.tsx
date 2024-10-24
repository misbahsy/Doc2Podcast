'use client';

import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, Upload, Mic, Download, Trash2, Play, Pause } from "lucide-react";
import axios from "axios";
import WaveSurfer from 'wavesurfer.js';

interface Podcast {
  id: number;
  name: string;
  url?: string;
}

interface Document {
  id: number;
  name: string;
  status: 'processing' | 'completed' | 'failed';
  uploadedAt: string;
}

interface Speaker {
  id: string;
  name: string;
  audioUrl: string;
}

const SPEAKERS: Speaker[] = [
  { id: 'alloy', name: 'Alloy', audioUrl: 'https://cdn.openai.com/API/docs/audio/alloy.wav' },
  { id: 'echo', name: 'Echo', audioUrl: 'https://cdn.openai.com/API/docs/audio/echo.wav' },
  { id: 'fable', name: 'Fable', audioUrl: 'https://cdn.openai.com/API/docs/audio/fable.wav' },
  { id: 'onyx', name: 'Onyx', audioUrl: 'https://cdn.openai.com/API/docs/audio/onyx.wav' },
  { id: 'nova', name: 'Nova', audioUrl: 'https://cdn.openai.com/API/docs/audio/nova.wav' },
  { id: 'shimmer', name: 'Shimmer', audioUrl: 'https://cdn.openai.com/API/docs/audio/shimmer.wav' },
];
const WaveformPlayer = ({ url, filename, onDelete }: { url: string, filename: string, onDelete?: (name: string) => void }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    async function initializeWavesurfer() {
      try {
        if (waveformRef.current && !wavesurfer.current) {
          wavesurfer.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#4F46E5',
            progressColor: '#818CF8',
            cursorColor: '#C7D2FE',
            barWidth: 2,
            barRadius: 3,
            cursorWidth: 1,
            height: 80,
            responsive: true,
            normalize: true,
            partialRender: true,
          });

          wavesurfer.current.on('play', () => setIsPlaying(true));
          wavesurfer.current.on('pause', () => setIsPlaying(false));
          wavesurfer.current.on('finish', () => setIsPlaying(false));
          wavesurfer.current.on('audioprocess', () => {
            setCurrentTime(wavesurfer.current?.getCurrentTime() || 0);
          });
          wavesurfer.current.on('ready', () => {
            setDuration(wavesurfer.current?.getDuration() || 0);
          });
        }

        if (wavesurfer.current) {
          await wavesurfer.current.load(url, undefined, signal);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.log("Error initializing wavesurfer:", error);
      }
    }

    initializeWavesurfer();

    return function cleanup() {
      abortController.abort();
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [url]);

  const togglePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const progress = parseFloat(e.target.value);
    if (wavesurfer.current) {
      wavesurfer.current.seekTo(progress);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(volume);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-white text-gray-800 p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium truncate max-w-[200px] text-sm">{filename}</span>
        <div className="flex items-center space-x-2">
          <a
            href={url}
            download={filename}
            className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={() => onDelete?.(filename)}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div ref={waveformRef} className="w-full" />
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={togglePlayPause}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <div className="flex items-center space-x-2 text-xs">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={currentTime / duration || 0}
            onChange={handleSeek}
            className="w-32 mx-2"
          />
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue="0.8"
          onChange={handleVolumeChange}
          className="w-24"
        />
      </div>
    </div>
  );
};

const PodcastItem = ({ podcast, onDelete }: { podcast: Podcast; onDelete: (name: string) => void }) => {
  const audioUrl = `/api/download/${podcast.name}`;
  
  return (
    <div className="bg-white text-gray-800 p-4 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex flex-col">
        <WaveformPlayer url={audioUrl} filename={podcast.name} onDelete={onDelete} />
      </div>
    </div>
  );
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [speakers, setSpeakers] = useState(2);
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(1000);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    fetchPodcasts();
    fetchDocuments();
  }, []);

  const fetchPodcasts = async () => {
    try {
      const response = await axios.get('/api/podcasts');
      setPodcasts(response.data);
    } catch (error) {
      console.error('Failed to fetch podcasts:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/api/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    // Validate file type
    const file = droppedFiles[0];
    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF file only');
      return;
    }
    setFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      if (file && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please upload a PDF file only');
        return;
      }
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSpeakerSelection = (speakerId: string) => {
    setSelectedSpeakers(prev => {
      if (prev.includes(speakerId)) {
        return prev.filter(id => id !== speakerId);
      }
      if (prev.length < speakers) {
        return [...prev, speakerId];
      }
      return prev;
    });
  };

  const toggleAudio = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      const audio = document.querySelector(`audio[src="${audioUrl}"]`) as HTMLAudioElement;
      audio.pause();
      setPlayingAudio(null);
    } else {
      if (playingAudio) {
        const prevAudio = document.querySelector(`audio[src="${playingAudio}"]`) as HTMLAudioElement;
        prevAudio.pause();
      }
      const audio = document.querySelector(`audio[src="${audioUrl}"]`) as HTMLAudioElement;
      audio.play();
      setPlayingAudio(audioUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length || selectedSpeakers.length === 0) return;

    const formattedInstructions = `user instructions are "${instructions}", and the number of words to use is ${wordCount}, make sure to keep it to the specified length, and the speakers to use is ${selectedSpeakers.join(', ')}`;

    setIsSubmitting(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('speakers', selectedSpeakers.join(','));
    formData.append('instructions', formattedInstructions);

    try {
      const response = await axios.post('/api/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setProgress(progress);
        },
      });

      if (response.data.filename) {
        await fetchPodcasts();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setFiles([]);
      setInstructions("");
    }
  };

  const handleDeleteDocument = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await axios.delete(`/api/documents?filename=${filename}`);
      await fetchDocuments();
    } catch (error) {
      console.error('Delete document failed:', error);
      alert('Delete document failed. Please try again.');
    }
  };

  const handleDeletePodcast = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this podcast?')) return;

    try {
      await axios.delete(`/api/podcasts?filename=${filename}`);
      await fetchPodcasts();
    } catch (error) {
      console.error('Delete podcast failed:', error);
      alert('Delete podcast failed. Please try again.');
    }
  };

  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-8 text-gray-800 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-4xl mx-auto bg-white rounded-xl p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
          Podcast Generator
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
          >
            <input
              type="file"
              onChange={handleFileInput}
              className="hidden"
              id="fileInput"
              accept=".pdf"
            />
            <label
              htmlFor="fileInput"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-gray-500" />
              <span className="text-gray-600">
                Drop your PDF file here or click to browse
              </span>
              {files.length > 0 && (
                <div className="flex flex-col items-center">
                  <span className="text-blue-500">{files[0].name}</span>
                  <span className="text-sm text-gray-500">
                    This PDF will be converted to an audio podcast
                  </span>
                </div>
              )}
            </label>
          </div>

          {/* Number of Speakers Slider */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Number of Speakers (Maximum)
            </label>
            <input
              type="range"
              min="1"
              max="6"
              value={speakers}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                setSpeakers(newValue);
                // Trim selected speakers if necessary
                if (selectedSpeakers.length > newValue) {
                  setSelectedSpeakers(prev => prev.slice(0, newValue));
                }
              }}
              className="w-full"
            />
            <span className="text-sm text-gray-500">Selected: {speakers}</span>
          </div>

          {/* Speaker Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Speakers ({selectedSpeakers.length}/{speakers})
            </label>
            <div className="grid grid-cols-2 gap-4">
              {SPEAKERS.map((speaker) => (
                <div key={speaker.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id={speaker.id}
                    checked={selectedSpeakers.includes(speaker.id)}
                    onChange={() => handleSpeakerSelection(speaker.id)}
                    disabled={!selectedSpeakers.includes(speaker.id) && selectedSpeakers.length >= speakers}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor={speaker.id} className="flex-1">{speaker.name}</label>
                  <button
                    type="button"
                    onClick={() => toggleAudio(speaker.audioUrl)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                  >
                    {playingAudio === speaker.audioUrl ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <audio src={speaker.audioUrl} />
                </div>
              ))}
            </div>
          </div>

          {/* Word Count Slider */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Conversation Length (words)
            </label>
            <input
              type="range"
              min="500"
              max="20000"
              step="100"
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{wordCount} words</span>
          </div>

          {/* Instructions Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
              placeholder="Enter instructions (e.g., Make it funny)"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !files.length}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing... {progress}%
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Generate Podcast
              </>
            )}
          </button>
        </form>

        {/* Uploaded Documents Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Uploaded Documents</h2>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{doc.name}</span>
                  <span className="text-sm text-gray-500">
                    Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      doc.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : doc.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                  <button
                    onClick={() => handleDeleteDocument(doc.name)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No documents uploaded yet
              </div>
            )}
          </div>
        </div>

        {/* Generated Podcasts Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Generated Podcasts</h2>
          <div className="space-y-4">
            {podcasts.map((podcast) => (
              <PodcastItem
                key={podcast.id}
                podcast={podcast}
                onDelete={handleDeletePodcast}
              />
            ))}
            {podcasts.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No podcasts generated yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
