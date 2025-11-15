import React from 'react';
import { PrevIcon, NextIcon, RepeatIcon, InfoIcon, BookOpenIcon } from './Icons';

interface AudioPlayerProps {
  currentSegmentIndex: number;
  totalSegments: number;
  onPrev: () => void;
  onNext: () => void;
  onRepeat: () => void;
  meaning?: string;
  showMeaning: boolean;
  onToggleMeaning: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  currentSegmentIndex, 
  totalSegments, 
  onPrev, 
  onNext, 
  onRepeat,
  meaning,
  showMeaning,
  onToggleMeaning
}) => {
  const isFirst = currentSegmentIndex === 0;
  const isLast = totalSegments > 0 && currentSegmentIndex === totalSegments - 1;

  const progressPercentage = totalSegments > 0 ? ((currentSegmentIndex + 1) / totalSegments) * 100 : 0;

  return (
    <div className="w-full max-w-lg p-4 sm:p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Spelling Word</h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-slate-400">
            {totalSegments > 0 ? currentSegmentIndex + 1 : 0} / {totalSegments}
          </span>
          {meaning !== undefined && (
            <button 
              onClick={onToggleMeaning} 
              className="text-slate-400 hover:text-sky-400 transition-colors" 
              aria-label="Toggle meaning"
            >
              <InfoIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 mb-6">
        <div
          className="bg-sky-500 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="flex items-center justify-center space-x-4 sm:space-x-6">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="p-3 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Previous word"
        >
          <PrevIcon className="w-6 h-6" />
        </button>
        <button
          onClick={onRepeat}
          className="p-4 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-all duration-200 shadow-lg shadow-sky-500/30 transform hover:scale-105"
          aria-label="Repeat word"
        >
          <RepeatIcon className="w-8 h-8" />
        </button>
        <button
          onClick={onNext}
          disabled={isLast}
          className="p-3 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Next word"
        >
          <NextIcon className="w-6 h-6" />
        </button>
      </div>

      {showMeaning && meaning && (
        <div className="mt-6 pt-4 border-t border-slate-700 animate-[fadeIn_0.5s_ease-in-out]">
          <h4 className="flex items-center text-md font-semibold text-slate-300 mb-2">
            <BookOpenIcon className="w-5 h-5 mr-2 text-sky-400" />
            Meaning
          </h4>
          <p className="text-slate-400 text-sm leading-relaxed">{meaning}</p>
        </div>
      )}
    </div>
  );
};