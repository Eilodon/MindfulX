import React, { useState, useEffect, useRef, useMemo } from 'react';
import BreathingBackground, { UrgencyLevel } from './components/BreathingBackground';
import WisdomCard from './components/WisdomCard';
import InputArea from './components/InputArea';
import TimerOverlay from './components/TimerOverlay';
import AudioPlayer from './components/AudioPlayer';
import { generateZenGuidance, generateChatResponse, generateSpeech } from './services/geminiService';
import { LiveSessionManager } from './services/liveService';
import { ZenResponse, UIState, Language, AppMode, ChatMessage } from './types';
import { COLORS, TRACKS, TRANSLATIONS } from './constants';
import { Volume2, Music, ListMusic, Play, Pause, Globe, VolumeX, Volume2 as VolumeIcon, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Cast motion components to any to avoid strict type checking issues with IntrinsicAttributes in some environments
const MotionDiv = motion.div as any;

const App: React.FC = () => {
  // --- Security & Auth State ---
  // API key is handled via process.env.API_KEY in services
  
  // --- Core UI State ---
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [mode, setMode] = useState<AppMode>('ZEN');
  const [zenData, setZenData] = useState<ZenResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [thoughtTrace, setThoughtTrace] = useState<string | null>(null);
  const [useSearch, setUseSearch] = useState(false);
  
  // --- Contextual Memory (History) ---
  const [history, setHistory] = useState<string[]>([]);
  
  // --- App Settings ---
  const [language, setLanguage] = useState<Language>('en');

  // --- Agentic States ---
  const [showTimer, setShowTimer] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // --- Text-to-Speech State ---
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  
  // --- Live API ---
  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  
  // --- Refs ---
  const thinkingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  
  // --- Music Panel UI State ---
  const [showMusicControls, setShowMusicControls] = useState(false);

  const t = TRANSLATIONS[language];

  // 1. Initialize History
  useEffect(() => {
    const storedHistory = localStorage.getItem('mindful_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Cancel TTS when language changes
  useEffect(() => {
    // Basic cancel
    window.speechSynthesis.cancel();
    // TODO: Cancel Gemini TTS AudioContext if implemented with stop()
  }, [language]);

  // 2. Gemini 2.5 TTS Logic
  const playGeminiTTS = async (text: string) => {
    if (!isTtsEnabled) return;
    try {
        const audioBuffer = await generateSpeech(text, language);
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start(0);
    } catch (e) {
        console.error("TTS Failed", e);
        // Fallback
        const u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(u);
    }
  };

  // 3. Derive urgency
  const urgency: UrgencyLevel = useMemo(() => {
    if (mode === 'LIVE') return 'high';
    if (!zenData) return 'low';
    const realm = zenData.realm.toLowerCase();
    const intent = zenData.action_intent;

    if (intent === 'PLAY_SOUND') return 'high';
    if (realm.includes('anxiety') || realm.includes('anger') || realm.includes('lo âu') || realm.includes('giận')) return 'high';
    if (intent === 'SET_ALARM') return 'medium';
    return 'low';
  }, [zenData, mode]);

  // 4. Click outside to close controls
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
    setShowTimer(false);
    setTimeout(() => {
      if (intent === 'SET_ALARM') {
        setShowTimer(true);
      } else if (intent === 'PLAY_SOUND') {
        setIsPlayingAudio(true);
        setShowMusicControls(true);
        setTimeout(() => setShowMusicControls(false), 3000);
      }
    }, 2000);
  };

  // --- MAIN ANALYSIS HANDLER ---
  const handleAnalyze = async (text: string, imageBase64?: string | null, isVoiceInput?: boolean) => {
    if (mode === 'CHAT') {
        setUiState(UIState.CHATTING);
        const newUserMsg: ChatMessage = { role: 'user', text, image: imageBase64 };
        const updatedHistory = [...chatHistory, newUserMsg];
        setChatHistory(updatedHistory);

        try {
            const response = await generateChatResponse(updatedHistory, text, imageBase64 || null, language, useSearch);
            const newModelMsg: ChatMessage = { 
                role: 'model', 
                text: response.text, 
                groundingMetadata: response.groundingMetadata 
            };
            setChatHistory([...updatedHistory, newModelMsg]);
            playGeminiTTS(response.text);
        } catch (e) {
            console.error("Chat Error", e);
        }
        return;
    }

    // ZEN MODE
    setUiState(UIState.BREATHING_IN);
    setZenData(null);
    setShowTimer(false);
    
    const thoughts = t.analyzing;
    setThoughtTrace(thoughts[0]);

    if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);

    thinkingIntervalRef.current = setInterval(() => {
      setThoughtTrace((currentTrace) => {
        const currentTraceSafe = currentTrace || thoughts[0];
        const currentIndex = thoughts.indexOf(currentTraceSafe);
        const nextIndex = (currentIndex + 1) % thoughts.length;
        return thoughts[nextIndex];
      });
    }, 1500);

    try {
      const response = await generateZenGuidance(text, language, history, imageBase64, isVoiceInput);
      
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      
      if (response.thought_trace) {
         setThoughtTrace(response.thought_trace);
         await new Promise(resolve => setTimeout(resolve, 1500));
      }

      setZenData(response);
      setUiState(UIState.SHOWING_WISDOM);
      
      playGeminiTTS(response.advice);
      
      const newHistory = [...history, response.realm].slice(-5);
      setHistory(newHistory);
      localStorage.setItem('mindful_history', JSON.stringify(newHistory));
      
      handleActionIntent(response.action_intent);

    } catch (error) {
      console.error(error);
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      setThoughtTrace(t.errorGeneric);
      setTimeout(() => setUiState(UIState.IDLE), 3000);
    }
  };

  // --- LIVE MODE HANDLER ---
  const toggleLiveMode = async () => {
      if (mode === 'LIVE') {
          // Stop Live
          liveSessionRef.current?.disconnect();
          liveSessionRef.current = null;
          setMode('ZEN');
          setUiState(UIState.IDLE);
      } else {
          // Start Live
          setMode('LIVE');
          setUiState(UIState.LIVE_SESSION);
          try {
            liveSessionRef.current = new LiveSessionManager((buffer) => {
                // Visualizer hook could go here
            });
            await liveSessionRef.current.connect();
          } catch (e) {
              console.error("Live Connect Error", e);
              setMode('ZEN');
          }
      }
  };

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-between overflow-hidden">
      
      {/* 0. Noise Overlay */}
      <div className="bg-noise fixed inset-0 z-50 opacity-[0.05] pointer-events-none mix-blend-multiply" />
      <svg style={{ position: 'fixed', width: 0, height: 0 }}>
        <filter id='noiseFilter'>
          <feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/>
        </filter>
      </svg>
      <style>{`
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
      `}</style>

      {/* Background Layer */}
      <BreathingBackground 
        isAccelerated={uiState === UIState.BREATHING_IN || uiState === UIState.CHATTING} 
        urgency={urgency}
      />

      {/* Audio Layer */}
      <AudioPlayer 
        isPlaying={isPlayingAudio} 
        volume={volume} 
        url={TRACKS[currentTrackIndex].url}
        onError={() => setIsPlayingAudio(false)}
      />

      {/* Overlay Layer */}
      <TimerOverlay 
        isOpen={showTimer} 
        onClose={() => setShowTimer(false)} 
        language={language}
      />

      {/* Top Left: Controls */}
      <div className="absolute top-6 left-6 z-[60] flex items-center space-x-2">
        <button
          onClick={() => setLanguage(l => l === 'en' ? 'vi' : 'en')}
          className="flex items-center space-x-2 px-3 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-sm hover:bg-white/40 transition-all text-[#2D2A26] font-medium text-sm"
        >
          <Globe className="w-4 h-4 opacity-70" />
          <span>{language === 'en' ? 'EN' : 'VN'}</span>
        </button>
      </div>

      {/* Top Right: Music */}
      <div 
        ref={controlsRef}
        className="absolute top-6 right-6 z-[60] flex flex-col items-end"
      >
        <button
          onClick={() => setShowMusicControls(!showMusicControls)}
          className={`
            p-3 rounded-full backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-105 active:scale-95
            ${isPlayingAudio ? 'bg-[#8DA399]/20 text-[#8DA399] border border-[#8DA399]/30' : 'bg-white/30 text-[#2D2A26] border border-white/40'}
          `}
        >
          {isPlayingAudio ? <Music className="w-6 h-6 animate-pulse" /> : <ListMusic className="w-6 h-6 opacity-60" />}
        </button>

        <AnimatePresence>
          {showMusicControls && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-3 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 p-4 shadow-xl w-64 origin-top-right"
            >
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
              <div className="mb-4">
                 <div className="flex items-center justify-between text-xs opacity-60 mb-1">
                    <Volume2 className="w-3 h-3" />
                    <span>{Math.round(volume * 100)}%</span>
                 </div>
                 <input
                    type="range" min="0" max="1" step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#8DA399] hover:accent-[#D87C4A] transition-colors"
                  />
              </div>
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
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full h-full max-w-lg mx-auto px-6 py-12 flex flex-col justify-between pointer-events-none">
        
        {/* Header */}
        <div className="text-center mt-8 pointer-events-auto">
          <h1 className="text-2xl tracking-[0.3em] font-light" style={{ color: COLORS.MonkRobe }}>
            {t.title}
          </h1>
        </div>

        {/* Display Area based on Mode */}
        <div className="flex-1 flex flex-col justify-center py-8 min-h-[400px] pointer-events-auto relative overflow-hidden">
          
          {/* ZEN MODE DISPLAY */}
          {mode === 'ZEN' && (
            <>
                <WisdomCard 
                    data={zenData} 
                    thoughtTrace={thoughtTrace} 
                    isVisible={uiState !== UIState.IDLE}
                    language={language}
                />
                 {uiState === UIState.SHOWING_WISDOM && zenData && (
                    <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-0 right-0 transform translate-y-full pt-2">
                    <button onClick={() => setIsTtsEnabled(!isTtsEnabled)} className="flex items-center space-x-2 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-[#2D2A26]/70 hover:bg-white/60 transition-colors shadow-sm">
                        {isTtsEnabled ? <VolumeIcon className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                        <span>Voice</span>
                    </button>
                    </MotionDiv>
                )}
            </>
          )}

          {/* CHAT MODE DISPLAY */}
          {mode === 'CHAT' && (
              <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-4 space-y-4 rounded-[32px] bg-white/30 backdrop-blur-md border border-white/50">
                  {chatHistory.length === 0 && (
                      <div className="flex items-center justify-center h-full text-[#2D2A26]/40 italic">
                          "Speak, and the silence shall answer."
                      </div>
                  )}
                  {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[#D87C4A] text-white rounded-br-none' : 'bg-white/70 text-[#2D2A26] rounded-bl-none shadow-sm'}`}>
                             {msg.image && (
                                 <img src={msg.image} alt="User" className="w-32 h-32 object-cover rounded-lg mb-2 border border-white/20" />
                             )}
                             {msg.text}
                          </div>
                          
                          {/* Search Grounding Sources */}
                          {msg.groundingMetadata && msg.groundingMetadata.groundingChunks?.length > 0 && (
                              <div className="mt-1 ml-2 flex flex-wrap gap-2">
                                  {msg.groundingMetadata.groundingChunks.map((chunk, idx) => chunk.web && (
                                      <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" 
                                         className="flex items-center space-x-1 text-[10px] bg-white/50 px-2 py-0.5 rounded-full hover:bg-white/80 transition-colors text-blue-600">
                                          <ExternalLink className="w-2 h-2" />
                                          <span className="truncate max-w-[100px]">{chunk.web.title}</span>
                                      </a>
                                  ))}
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          )}

          {/* LIVE MODE VISUALIZER */}
          {mode === 'LIVE' && (
              <div className="flex flex-col items-center justify-center h-full">
                  <MotionDiv 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-40 h-40 rounded-full bg-gradient-to-br from-[#D87C4A] to-purple-500 blur-2xl"
                  />
                  <p className="mt-8 text-xl font-zen text-[#2D2A26] opacity-70">
                      The Master is listening...
                  </p>
              </div>
          )}

        </div>

        {/* Input Area */}
        <div className="mb-4 w-full pointer-events-auto mt-4">
           <InputArea 
             onAnalyze={handleAnalyze} 
             isLoading={uiState === UIState.BREATHING_IN} 
             language={language}
             mode={mode}
             setMode={setMode}
             useSearch={useSearch}
             setUseSearch={setUseSearch}
             onLiveStart={toggleLiveMode}
             isLiveActive={mode === 'LIVE'}
           />
        </div>

      </div>
    </div>
  );
};

export default App;