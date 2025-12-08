
import React, { useState, useEffect, useRef, useMemo } from 'react';
import BreathingBackground, { UrgencyLevel } from './components/BreathingBackground';
import WisdomCard from './components/WisdomCard';
import InputArea from './components/InputArea';
import TimerOverlay from './components/TimerOverlay';
import AudioPlayer from './components/AudioPlayer';
import { generateZenGuidance } from './services/geminiService';
import { ZenResponse, UIState, Language } from './types';
import { COLORS, TRACKS, TRANSLATIONS } from './constants';
import { Volume2, VolumeX, Music, ListMusic, Play, Pause, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [zenData, setZenData] = useState<ZenResponse | null>(null);
  const [thoughtTrace, setThoughtTrace] = useState<string | null>(null);
  
  // App Settings
  const [language, setLanguage] = useState<Language>('en');

  // Agentic States
  const [showTimer, setShowTimer] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  
  // Music Panel UI State
  const [showMusicControls, setShowMusicControls] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];

  // Derive urgency from zenData
  const urgency: UrgencyLevel = useMemo(() => {
    if (!zenData) return 'low';
    const realm = zenData.realm.toLowerCase();
    const intent = zenData.action_intent;

    if (intent === 'PLAY_SOUND') return 'high';
    if (realm.includes('anxiety') || realm.includes('anger') || realm.includes('lo âu') || realm.includes('giận')) return 'high';
    if (intent === 'SET_ALARM') return 'medium';
    return 'low';
  }, [zenData]);

  // Handle click outside to auto-fade/close controls
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
        setShowMusicControls(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleActionIntent = (intent: string) => {
    // Reset previous states
    setShowTimer(false);
    
    // Wait a moment after wisdom is shown to trigger action
    setTimeout(() => {
      if (intent === 'SET_ALARM') {
        setShowTimer(true);
      } else if (intent === 'PLAY_SOUND') {
        setIsPlayingAudio(true);
        // Ensure controls pulse or show briefly to indicate sound started
        setShowMusicControls(true);
        setTimeout(() => setShowMusicControls(false), 3000);
      }
    }, 2000);
  };

  const handleAnalyze = async (text: string) => {
    setUiState(UIState.BREATHING_IN);
    setZenData(null);
    setShowTimer(false);
    
    // Dynamic Monologue Sequence based on language
    const thoughts = t.analyzing;
    setThoughtTrace(thoughts[0]);

    // Fix: Use functional state update pattern to prevent closure staleness
    // This ensures we always have the fresh state when calculating the next index
    const thoughtInterval = setInterval(() => {
      setThoughtTrace((currentTrace) => {
        const currentIndex = currentTrace ? thoughts.indexOf(currentTrace) : 0;
        const nextIndex = (currentIndex + 1) % thoughts.length;
        return thoughts[nextIndex];
      });
    }, 1500);

    try {
      const response = await generateZenGuidance(text, language);
      
      clearInterval(thoughtInterval);
      
      if (response.thought_trace) {
         setThoughtTrace(response.thought_trace);
         // Pause briefly to let the user read the AI's specific thought
         await new Promise(resolve => setTimeout(resolve, 1500));
      }

      setZenData(response);
      setUiState(UIState.SHOWING_WISDOM);
      
      handleActionIntent(response.action_intent);

    } catch (error) {
      console.error(error);
      clearInterval(thoughtInterval); // Ensure interval is cleared on error
      setThoughtTrace(t.errorGeneric);
      setTimeout(() => setUiState(UIState.IDLE), 3000);
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-between overflow-hidden">
      
      {/* 1. Background Layer: The Living Breath */}
      <BreathingBackground 
        isAccelerated={uiState === UIState.BREATHING_IN} 
        urgency={urgency}
      />

      {/* 2. Audio Layer (Hidden) */}
      <AudioPlayer 
        isPlaying={isPlayingAudio} 
        volume={volume} 
        url={TRACKS[currentTrackIndex].url}
        onError={() => {
          console.warn("Audio playback failed in App");
          setIsPlayingAudio(false);
        }}
      />

      {/* 3. Overlay Layer (Timer) */}
      <TimerOverlay 
        isOpen={showTimer} 
        onClose={() => setShowTimer(false)} 
        language={language}
      />

      {/* Language Switcher (Top Left) */}
      <button
        onClick={() => setLanguage(l => l === 'en' ? 'vi' : 'en')}
        className="absolute top-6 left-6 z-50 flex items-center space-x-2 px-3 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-sm hover:bg-white/40 transition-all text-[#2D2A26] font-medium text-sm"
      >
        <Globe className="w-4 h-4 opacity-70" />
        <span>{language === 'en' ? 'EN' : 'VN'}</span>
      </button>

      {/* 4. Music Controls & Library Panel (Top Right) */}
      <div 
        ref={controlsRef}
        className="absolute top-6 right-6 z-50 flex flex-col items-end"
      >
        {/* Main Toggle Icon */}
        <button
          onClick={() => setShowMusicControls(!showMusicControls)}
          className={`
            p-3 rounded-full backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-105 active:scale-95
            ${isPlayingAudio ? 'bg-[#8DA399]/20 text-[#8DA399] border border-[#8DA399]/30' : 'bg-white/30 text-[#2D2A26] border border-white/40'}
          `}
          aria-label="Toggle Music Controls"
        >
          {isPlayingAudio ? <Music className="w-6 h-6 animate-pulse" /> : <ListMusic className="w-6 h-6 opacity-60" />}
        </button>

        {/* Expandable Control Panel */}
        <AnimatePresence>
          {showMusicControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-3 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 p-4 shadow-xl w-64 origin-top-right"
            >
              {/* Header: Track Info & Play Toggle */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-500/10">
                <div className="flex flex-col overflow-hidden mr-2">
                  <span className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">{t.nowPlaying}</span>
                  <span className="text-sm font-medium truncate text-[#2D2A26]">{TRACKS[currentTrackIndex].name}</span>
                </div>
                <button
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="p-2 rounded-full bg-[#D87C4A] text-white hover:bg-[#c06b3d] transition-colors shadow-md flex-shrink-0"
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="mb-4">
                 <div className="flex items-center justify-between text-xs opacity-60 mb-1">
                    <Volume2 className="w-3 h-3" />
                    <span>{Math.round(volume * 100)}%</span>
                 </div>
                 <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#8DA399] hover:accent-[#D87C4A] transition-colors"
                  />
              </div>

              {/* Track Library List */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider opacity-50 font-semibold block mb-1">{t.library}</span>
                {TRACKS.map((track, index) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      setCurrentTrackIndex(index);
                      setIsPlayingAudio(true);
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center
                      ${currentTrackIndex === index 
                        ? 'bg-[#8DA399]/20 text-[#2f3e37] font-medium' 
                        : 'hover:bg-white/40 text-[#2D2A26]/80'}
                    `}
                  >
                    {currentTrackIndex === index && <div className="w-1.5 h-1.5 rounded-full bg-[#8DA399] mr-2" />}
                    {track.name}
                  </button>
                ))}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Content Layer */}
      <div className="relative z-10 w-full h-full max-w-lg mx-auto px-6 py-12 flex flex-col justify-between pointer-events-none">
        
        {/* Header */}
        <div className="text-center mt-8 pointer-events-auto">
          <h1 className="text-2xl tracking-[0.3em] font-light" style={{ color: COLORS.MonkRobe }}>
            {t.title}
          </h1>
        </div>

        {/* Wisdom Display (Center-ish) */}
        <div className="flex-1 flex flex-col justify-center py-8 min-h-[400px] pointer-events-auto">
          <WisdomCard 
            data={zenData} 
            thoughtTrace={thoughtTrace} 
            isVisible={uiState !== UIState.IDLE}
            language={language}
          />
        </div>

        {/* Input Area (Bottom) */}
        <div className="mb-4 w-full pointer-events-auto">
           <InputArea 
             onAnalyze={handleAnalyze} 
             isLoading={uiState === UIState.BREATHING_IN} 
             language={language}
           />
        </div>

      </div>
    </div>
  );
};

export default App;
