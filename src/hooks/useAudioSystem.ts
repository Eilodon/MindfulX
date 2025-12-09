import { useState, useRef, useEffect } from 'react';
import { TRACKS } from '../constants';

export const useAudioSystem = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [trackIndex, setTrackIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close controls
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
        setShowControls(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const togglePlay = () => setIsPlaying(prev => !prev);

  return {
    isPlaying,
    setIsPlaying, // Expose setter for direct control if needed
    volume,
    setVolume,
    trackIndex,
    setTrackIndex,
    showControls,
    setShowControls,
    controlsRef,
    play,
    pause,
    togglePlay,
    currentTrack: TRACKS[trackIndex]
  };
};