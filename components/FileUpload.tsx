import React, { useCallback, useState } from 'react';
import { UploadIcon, AudioFileIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'audio/wav') {
        onFileSelect(file);
      }
      e.dataTransfer.clearData();
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <label
        htmlFor="audio-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${
          disabled ? 'cursor-not-allowed bg-slate-800 border-slate-700' : 
          isDragging ? 'border-sky-400 bg-slate-700' : 'border-slate-600 bg-slate-800 hover:bg-slate-700 hover:border-slate-500'
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
          <div className="flex items-center space-x-4">
            <AudioFileIcon className="w-12 h-12 mb-4 text-slate-500" />
          </div>
          <p className="mb-2 text-sm">
            <span className="font-semibold text-sky-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs">WAV audio file only</p>
        </div>
        <input id="audio-upload" type="file" className="hidden" accept=".wav,audio/wav" onChange={handleFileChange} disabled={disabled}/>
      </label>
    </div>
  );
};