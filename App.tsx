import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { WordSegment, PlaybackMode } from './types';
import { PlaybackMode as PlaybackModeEnum } from './types';
import { processAudioFile } from './services/audioProcessor';
import { FileUpload } from './components/FileUpload';
import { AudioPlayer } from './components/AudioPlayer';
import { Settings } from './components/Settings';
import { Spinner } from './components/Icons';

export default function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [wordSegments, setWordSegments] = useState<WordSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(PlaybackModeEnum.All);
  const [playbackCount, setPlaybackCount] = useState(10);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const [meanings, setMeanings] = useState<string[]>([]);
  const [showMeaning, setShowMeaning] = useState(false);
  const [meaningError, setMeaningError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const autoPlayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
      audioContextRef.current?.close();
    };
  }, []);

  const resetState = () => {
    setAudioFile(null);
    setAudioBuffer(null);
    setWordSegments([]);
    setCurrentSegmentIndex(0);
    setError(null);
    setIsAutoPlaying(false);
    setMeanings([]);
    setShowMeaning(false);
    setMeaningError(null);

    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
    }
  };
  
  const handleFileSelect = useCallback(async (file: File) => {
    resetState();
    setIsLoading(true);
    setError(null);

    try {
      const segments = await processAudioFile(file);
      if (segments.length === 0) {
        throw new Error("Could not detect any word segments. Please check the audio file for clear silences between words.");
      }
      
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;
      const buffer = await context.decodeAudioData(await file.arrayBuffer());

      setAudioFile(file);
      setAudioBuffer(buffer);
      setWordSegments(segments);
      setCurrentSegmentIndex(0);
      if(playbackCount > segments.length) {
        setPlaybackCount(segments.length);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred during processing.");
    } finally {
      setIsLoading(false);
    }
  }, [playbackCount]);

  const playSegment = useCallback((index: number, isAutoPlayContinuation = false) => {
    if (!audioBuffer || !audioContextRef.current || index < 0 || index >= wordSegments.length) {
      if (isAutoPlayContinuation) setIsAutoPlaying(false);
      return;
    }
    
    if(audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Ignore errors from stopping an already stopped source
      }
    }

    const segment = wordSegments[index];
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);

    const offset = segment.startTime;
    const duration = segment.endTime - segment.startTime;
    source.start(0, offset, duration);

    sourceNodeRef.current = source;
    setCurrentSegmentIndex(index);

    source.onended = () => {
        if (isAutoPlayContinuation) {
            const nextIndex = index + 1;
            const wordsToPlay = playbackMode === PlaybackModeEnum.All ? wordSegments.length : (playbackCount > 0 ? playbackCount : wordSegments.length);

            if (nextIndex < wordsToPlay && nextIndex < wordSegments.length) {
                autoPlayTimerRef.current = window.setTimeout(() => playSegment(nextIndex, true), 50);
            } else {
                setIsAutoPlaying(false);
            }
        }
    };

  }, [audioBuffer, wordSegments, playbackMode, playbackCount]);

  const handlePrev = () => {
    stopAutoPlay();
    if (currentSegmentIndex > 0) {
      playSegment(currentSegmentIndex - 1);
    }
  };

  const handleNext = () => {
    stopAutoPlay();
    if (currentSegmentIndex < wordSegments.length - 1) {
      playSegment(currentSegmentIndex + 1);
    }
  };

  const handleRepeat = () => {
    stopAutoPlay();
    playSegment(currentSegmentIndex);
  };
  
  const stopAutoPlay = () => {
    setIsAutoPlaying(false);
    if(autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
    }
    if (sourceNodeRef.current) {
        sourceNodeRef.current.onended = null;
        try {
          sourceNodeRef.current.stop();
        } catch(e) {}
    }
  }

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      stopAutoPlay();
    } else {
      setIsAutoPlaying(true);
      setCurrentSegmentIndex(0);
      playSegment(0, true);
    }
  };

  const handleMeaningsFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMeaningError(null);
    try {
      const text = await file.text();
      const loadedMeanings = text.split(',').map(m => m.trim()).filter(Boolean);
      setMeanings(loadedMeanings);
      if (loadedMeanings.length !== wordSegments.length) {
        setMeaningError(`Warning: Found ${wordSegments.length} words but ${loadedMeanings.length} meanings. They may not match up correctly.`);
      }
    } catch (err) {
      setMeaningError("Failed to read or parse the meanings file.");
      setMeanings([]);
    } finally {
        e.target.value = ''; // Allow re-uploading the same file
    }
  };

  const toggleShowMeaning = () => setShowMeaning(prev => !prev);

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-sky-900/30 via-slate-900 to-slate-900 -z-10"></div>
      <div className="w-full max-w-2xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-2 tracking-tight">
          Spelling Bee Audio Player
        </h1>
        <p className="text-lg text-slate-400 mb-8">
          Upload your spelling list and practice word by word.
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Spinner className="w-12 h-12 text-sky-500" />
            <p className="mt-4 text-slate-300">Analyzing audio, please wait...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button onClick={resetState} className="ml-4 px-2 py-1 bg-red-700 rounded hover:bg-red-600">Try Again</button>
          </div>
        ) : !audioFile ? (
          <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
        ) : (
          <div className="flex flex-col items-center">
            <AudioPlayer
              currentSegmentIndex={currentSegmentIndex}
              totalSegments={wordSegments.length}
              onPrev={handlePrev}
              onNext={handleNext}
              onRepeat={handleRepeat}
              meaning={meanings.length > currentSegmentIndex ? meanings[currentSegmentIndex] : undefined}
              showMeaning={showMeaning}
              onToggleMeaning={toggleShowMeaning}
            />

            {meaningError && (
              <div className="w-full max-w-lg mt-4 bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg" role="alert">
                <p>{meaningError}</p>
              </div>
            )}

            <Settings
              playbackMode={playbackMode}
              setPlaybackMode={setPlaybackMode}
              playbackCount={playbackCount}
              setPlaybackCount={setPlaybackCount}
              onToggleAutoPlay={toggleAutoPlay}
              maxWords={wordSegments.length}
              isAutoPlaying={isAutoPlaying}
            />

            <div className="w-full max-w-lg mt-6 p-4 sm:p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Word Meanings (Optional)</h3>
              {meanings.length > 0 ? (
                <div className="text-center">
                  <p className="text-slate-300">✅ Meanings for {meanings.length} words loaded.</p>
                  <button onClick={() => { setMeanings([]); setMeaningError(null); }} className="mt-2 text-sm text-slate-500 hover:text-sky-400 transition-colors">
                    Upload different meanings
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-400 mb-3 text-left">Upload a comma-separated <code className="bg-slate-700 p-1 rounded">.txt</code> file.</p>
                  <input
                    type="file"
                    accept=".txt,text/plain"
                    onChange={handleMeaningsFileSelect}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700 cursor-pointer"
                  />
                </div>
              )}
            </div>
            
            <button onClick={resetState} className="mt-8 text-sm text-slate-500 hover:text-sky-400 transition-colors">
              Upload a different file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}