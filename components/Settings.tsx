import React from 'react';
import type { PlaybackMode } from '../types';
import { PlaybackMode as PlaybackModeEnum } from '../types';
import { PlayIcon, PauseIcon } from './Icons';

interface SettingsProps {
  playbackMode: PlaybackMode;
  setPlaybackMode: (mode: PlaybackMode) => void;
  playbackCount: number;
  setPlaybackCount: (count: number) => void;
  onToggleAutoPlay: () => void;
  maxWords: number;
  isAutoPlaying: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ playbackMode, setPlaybackMode, playbackCount, setPlaybackCount, onToggleAutoPlay, maxWords, isAutoPlaying }) => {
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueAsString = e.target.value;
    // Allow empty input for typing, represented by 0 internally
    const numericValue = valueAsString === '' ? 0 : parseInt(valueAsString, 10);

    if (isNaN(numericValue)) return;
    
    // Clamp value to maxWords while typing
    const clampedValue = numericValue > maxWords ? maxWords : numericValue;
    setPlaybackCount(clampedValue);
  };

  const handleCountBlur = () => {
    if (playbackCount < 1) {
      setPlaybackCount(1);
    }
  };
  
  return (
    <div className="w-full max-w-lg mt-6 p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">Playback Settings</h3>
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4">
        <div className="flex items-center mb-2 sm:mb-0">
          <input
            id="play-all"
            type="radio"
            value={PlaybackModeEnum.All}
            checked={playbackMode === PlaybackModeEnum.All}
            onChange={() => setPlaybackMode(PlaybackModeEnum.All)}
            className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 focus:ring-sky-500"
          />
          <label htmlFor="play-all" className="ml-2 text-sm font-medium text-slate-300">Play All</label>
        </div>
        <div className="flex items-center">
          <input
            id="play-count"
            type="radio"
            value={PlaybackModeEnum.Count}
            checked={playbackMode === PlaybackModeEnum.Count}
            onChange={() => setPlaybackMode(PlaybackModeEnum.Count)}
            className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 focus:ring-sky-500"
          />
          <label htmlFor="play-count" className="ml-2 text-sm font-medium text-slate-300">Play # of words</label>
        </div>
      </div>
      {playbackMode === PlaybackModeEnum.Count && (
        <div className="mb-4">
          <input
            type="number"
            value={playbackCount === 0 ? '' : playbackCount}
            onChange={handleCountChange}
            onBlur={handleCountBlur}
            min="1"
            max={maxWords}
            placeholder="Enter # of words"
            className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
          />
        </div>
      )}
      <button
        onClick={onToggleAutoPlay}
        className={`w-full flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white rounded-lg focus:ring-4 transition-colors ${
          isAutoPlaying 
            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-300' 
            : 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-300'
        }`}
      >
        {isAutoPlaying ? <PauseIcon className="w-5 h-5 mr-2" /> : <PlayIcon className="w-5 h-5 mr-2" />}
        {isAutoPlaying ? 'Stop Auto-Play' : 'Start Auto-Play'}
      </button>
    </div>
  );
};