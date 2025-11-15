
import type { WordSegment } from '../types';

const SILENCE_THRESHOLD = 0.01;
const MIN_SILENCE_DURATION_S = 0.4; // A bit less than a second to be safe
const MIN_WORD_DURATION_S = 0.1;

export const processAudioFile = async (file: File): Promise<WordSegment[]> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const minSilenceSamples = MIN_SILENCE_DURATION_S * sampleRate;

  const segments: WordSegment[] = [];
  let wordStartSample = 0;
  let inWord = false;

  for (let i = 0; i < channelData.length; i++) {
    if (Math.abs(channelData[i]) > SILENCE_THRESHOLD && !inWord) {
      inWord = true;
      wordStartSample = i;
    }
    
    if (inWord) {
      // Check for end of word (silence)
      let silentSamples = 0;
      let j = i;
      while(j < channelData.length && Math.abs(channelData[j]) <= SILENCE_THRESHOLD) {
        silentSamples++;
        j++;
      }

      if (silentSamples > minSilenceSamples) {
        const wordEndSample = i;
        const startTime = wordStartSample / sampleRate;
        const endTime = wordEndSample / sampleRate;
        
        if (endTime - startTime >= MIN_WORD_DURATION_S) {
          segments.push({ startTime, endTime });
        }
        
        inWord = false;
        i = j - 1; // Move pointer past the detected silence
      }
    }
  }

  // Handle case where the last word goes to the end of the file
  if (inWord) {
    const startTime = wordStartSample / sampleRate;
    const endTime = channelData.length / sampleRate;
    if (endTime - startTime >= MIN_WORD_DURATION_S) {
      segments.push({ startTime, endTime });
    }
  }

  await audioContext.close();
  return segments;
};
