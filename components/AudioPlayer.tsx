
import React, { useEffect, useRef } from 'react';

interface AudioPlayerProps {
  isPlaying: boolean;
  volume: number;
  url: string;
  onError?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ isPlaying, volume, url, onError }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  // Use ref to track current URL accurately to avoid comparing with DOM's resolved src
  const currentUrlRef = useRef<string | null>(null);

  // 1. Volume Handling (Separated to avoid re-triggering play logic)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 2. Play/Pause and Track Change Handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !url) return;

    let isCancelled = false;

    const manageAudio = async () => {
      try {
        const hasUrlChanged = currentUrlRef.current !== url;

        if (hasUrlChanged) {
           currentUrlRef.current = url;
           audio.src = url;
           audio.load(); // Mandatory reload when source changes
        }

        if (isPlaying) {
          // Only call play if paused or track just changed
          if (audio.paused || hasUrlChanged) {
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
              await playPromise.catch((error) => {
                if (isCancelled) return;
                
                // Detailed promise error logging
                console.error(`Audio Play Promise Error: ${error.name} - ${error.message} (Code: ${(error as any).code || 'N/A'})`);

                if (error.name === 'NotAllowedError') {
                  console.warn("🔇 Autoplay Blocked. User needs to interact with the document first.");
                  if (onError) onError();
                } else if (error.name === 'AbortError') {
                  // Safe ignore: occurs if pause() is called while loading
                } else {
                  if (onError) onError();
                }
              });
            }
          }
        } else {
          // Pause Logic
          if (!audio.paused) {
             audio.pause();
          }
        }
      } catch (e) {
        console.error("Unexpected Audio Manager Error", e);
      }
    };

    manageAudio();

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [isPlaying, url, onError]); 

  if (!url) return null;

  return (
    <audio 
      ref={audioRef}
      loop
      playsInline
      preload="auto"
      className="hidden"
      // Removed crossOrigin="anonymous" to fix GitHub raw content CORS issues
      onError={(e) => {
        const target = e.currentTarget;
        const error = target.error;
        // Fix: Log as string to avoid [object Object] output in some consoles
        const errorMsg = error ? `${error.message} (Code: ${error.code})` : "Unknown Error";
        console.error(`Audio Resource Error: ${errorMsg} | URL: ${target.src}`);
        
        if (onError) onError();
      }}
    />
  );
};

export default AudioPlayer;
