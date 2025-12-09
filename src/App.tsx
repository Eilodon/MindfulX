import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Music, ListMusic, Play, Pause, Globe, VolumeX, Volume2 as VolumeIcon, ExternalLink } from 'lucide-react';

// Hooks
import { useZenMode } from './hooks/useZenMode';
import { useAudioSystem } from './hooks/useAudioSystem';
import { useLiveSession } from './hooks/useLiveSession';

// Services & Components
import { generateSpeech } from './services/geminiService';
import BreathingBackground from './components/BreathingBackground';
import WisdomCard from './components/WisdomCard';
import InputArea from './components/InputArea';
import TimerOverlay from './components/TimerOverlay';
import AudioPlayer from './components/AudioPlayer';
import ApiKeyModal from './components/ApiKeyModal';

// Constants & Types
import { COLORS, TRANSLATIONS, TRACKS } from './constants';
import { UIState, Language, AppMode } from './types';

const App: React.FC = () => {
  // --- Global App State ---
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [mode, setMode] = useState<AppMode>('ZEN');
  const [useSearch, setUseSearch] = useState(false);
  
  // --- Feature Flags/State ---
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [showTimer, setShowTimer] = useState(false);

  // --- Custom Hooks ---
  const audio = useAudioSystem();
  const liveSession = useLiveSession();
  
  const t = TRANSLATIONS[language];

  // --- Initialization ---
  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key');
    if (key) setApiKey(key);
    else setShowKeyModal(true);
  }, []);

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyModal(false);
  };

  // --- Helper: TTS ---
  const playTTS = useCallback(async (text: string) => {
    if (!isTtsEnabled || !apiKey) return;
    try {
        const audioBuffer = await generateSpeech(text, language, apiKey);
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start(0);
    } catch (e) {
        console.error("TTS Failed", e);
        // Browser fallback
        const u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(u);
    }
  }, [isTtsEnabled, apiKey, language]);

  // Cancel TTS when language changes
  useEffect(() => {
    window.speechSynthesis.cancel();
  }, [language]);

  // --- Helper: Action Intent Handler ---
  const handleActionIntent = useCallback((intent: string) => {
    setShowTimer(false);
    setTimeout(() => {
      if (intent === 'SET_ALARM') {
        setShowTimer(true);
      } else if (intent === 'PLAY_SOUND') {
        audio.play();
        audio.setShowControls(true);
        setTimeout(() => audio.setShowControls(false), 3000);
      }
    }, 2000);
  }, [audio]);

  // --- Zen Mode Hook ---
  const zen = useZenMode({
    apiKey,
    language,
    onActionIntent: handleActionIntent,
    onTts: playTTS
  });

  // --- Handler: Input Analysis ---
  const handleAnalyze = (text: string, imageBase64?: string | null, isVoiceInput?: boolean) => {
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }
    // Delegate to Zen Hook
    zen.analyze(text, mode === 'CHAT' ? 'CHAT' : 'ZEN', { 
        image: imageBase64, 
        isVoice: isVoiceInput, 
        useSearch 
    });
  };

  // --- Handler: Live Mode Toggle ---
  const toggleLiveMode = async () => {
      if (!apiKey) { setShowKeyModal(true); return; }

      if (mode === 'LIVE') {
          liveSession.disconnect();
          setMode('ZEN');
          zen.setUiState(UIState.IDLE);
      } else {
          setMode('LIVE');
          zen.setUiState(UIState.LIVE_SESSION);
          try {
            await liveSession.connect(apiKey);
          } catch (e) {
              console.error("Live Session Failed", e);
              setMode('ZEN');
              zen.setUiState(UIState.IDLE);
          }
      }
  };

  // --- Render ---
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-between overflow-hidden bg-[#FFF8E7]">
      
      <ApiKeyModal isOpen={showKeyModal} onSave={handleSaveKey} />

      {/* Noise Texture (Handled in CSS now) */}
      <div className="bg-noise" />

      {/* Background & Audio */}
      <BreathingBackground 
        isAccelerated={zen.uiState === UIState.BREATHING_IN || zen.uiState === UIState.CHATTING} 
        urgency={mode === 'LIVE' ? 'high' : zen.urgency}
      />

      <AudioPlayer 
        isPlaying={audio.isPlaying} 
        volume={audio.volume} 
        url={audio.currentTrack.url}
        onError={audio.pause}
      />

      <TimerOverlay 
        isOpen={showTimer} 
        onClose={() => setShowTimer(false)} 
        language={language}
      />

      {/* Top Left: Language */}
      <div className="absolute top-6 left-6 z-[60] flex items-center space-x-2">
        <button
          onClick={() => setLanguage(l => l === 'en' ? 'vi' : 'en')}
          className="flex items-center space-x-2 px-3 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-sm hover:bg-white/40 transition-all text-[#2D2A26] font-medium text-sm"
        >
          <Globe className="w-4 h-4 opacity-70" />
          <span>{language === 'en' ? 'EN' : 'VN'}</span>
        </button>
      </div>

      {/* Top Right: Music Controls */}
      <div ref={audio.controlsRef} className="absolute top-6 right-6 z-[60] flex flex-col items-end">
        <button
          onClick={() => audio.setShowControls(!audio.showControls)}
          className={`
            p-3 rounded-full backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-105 active:scale-95
            ${audio.isPlaying ? 'bg-[#8DA399]/20 text-[#8DA399] border border-[#8DA399]/30' : 'bg-white/30 text-[#2D2A26] border border-white/40'}
          `}
        >
          {audio.isPlaying ? <Music className="w-6 h-6 animate-pulse" /> : <ListMusic className="w-6 h-6 opacity-60" />}
        </button>

        <AnimatePresence>
          {audio.showControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="mt-3 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 p-4 shadow-xl w-64 origin-top-right"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-500/10">
                <div className="flex flex-col overflow-hidden mr-2">
                  <span className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">{t.nowPlaying}</span>
                  <span className="text-sm font-medium truncate text-[#2D2A26]">{audio.currentTrack.name}</span>
                </div>
                <button onClick={audio.togglePlay} className="p-2 rounded-full bg-[#D87C4A] text-white hover:bg-[#c06b3d] shadow-md flex-shrink-0">
                  {audio.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
              </div>
              <div className="mb-4">
                 <div className="flex items-center justify-between text-xs opacity-60 mb-1">
                    <VolumeIcon className="w-3 h-3" />
                    <span>{Math.round(audio.volume * 100)}%</span>
                 </div>
                 <input type="range" min="0" max="1" step="0.01" value={audio.volume} onChange={(e) => audio.setVolume(parseFloat(e.target.value))} className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#8DA399]" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider opacity-50 font-semibold block mb-1">{t.library}</span>
                {TRACKS.map((track, index) => (
                  <button
                    key={track.id}
                    onClick={() => { audio.setTrackIndex(index); audio.setIsPlaying(true); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center ${audio.trackIndex === index ? 'bg-[#8DA399]/20 text-[#2f3e37] font-medium' : 'hover:bg-white/40 text-[#2D2A26]/80'}`}
                  >
                    {audio.trackIndex === index && <div className="w-1.5 h-1.5 rounded-full bg-[#8DA399] mr-2" />}
                    {track.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full max-w-lg mx-auto px-6 py-12 flex flex-col justify-between pointer-events-none">
        
        {/* Header */}
        <div className="text-center mt-8 pointer-events-auto">
          <h1 className="text-2xl tracking-[0.3em] font-light" style={{ color: COLORS.MonkRobe }}>{t.title}</h1>
        </div>

        {/* Display Area */}
        <div className="flex-1 flex flex-col justify-center py-8 min-h-[400px] pointer-events-auto relative overflow-hidden">
          
          {mode === 'ZEN' && (
            <>
                <WisdomCard 
                    data={zen.zenData} 
                    thoughtTrace={zen.thoughtTrace} 
                    isVisible={zen.uiState !== UIState.IDLE}
                    language={language}
                />
                 {zen.uiState === UIState.SHOWING_WISDOM && zen.zenData && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-0 right-0 transform translate-y-full pt-2">
                    <button onClick={() => setIsTtsEnabled(!isTtsEnabled)} className="flex items-center space-x-2 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-[#2D2A26]/70 hover:bg-white/60 transition-colors shadow-sm">
                        {isTtsEnabled ? <VolumeIcon className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                        <span>Voice</span>
                    </button>
                    </motion.div>
                )}
            </>
          )}

          {mode === 'CHAT' && (
              <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-4 space-y-4 rounded-[32px] bg-white/30 backdrop-blur-md border border-white/50">
                  {zen.chatHistory.length === 0 && (
                      <div className="flex items-center justify-center h-full text-[#2D2A26]/40 italic">
                          "Speak, and the silence shall answer."
                      </div>
                  )}
                  {zen.chatHistory.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[#D87C4A] text-white rounded-br-none' : 'bg-white/70 text-[#2D2A26] rounded-bl-none shadow-sm'}`}>
                             {msg.image && <img src={msg.image} alt="User" className="w-32 h-32 object-cover rounded-lg mb-2 border border-white/20" />}
                             {msg.text}
                          </div>
                          {msg.groundingMetadata?.groundingChunks?.map((chunk, idx) => chunk.web && (
                             <div key={idx} className="mt-1 ml-2 flex flex-wrap gap-2">
                               <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-[10px] bg-white/50 px-2 py-0.5 rounded-full text-blue-600">
                                  <ExternalLink className="w-2 h-2" />
                                  <span className="truncate max-w-[100px]">{chunk.web.title}</span>
                               </a>
                             </div>
                          ))}
                      </div>
                  ))}
              </div>
          )}

          {mode === 'LIVE' && (
              <div className="flex flex-col items-center justify-center h-full">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-40 h-40 rounded-full bg-gradient-to-br from-[#D87C4A] to-purple-500 blur-2xl"
                  />
                  <p className="mt-8 text-xl font-zen text-[#2D2A26] opacity-70">The Master is listening...</p>
              </div>
          )}
        </div>

        {/* Input Area */}
        <div className="mb-4 w-full pointer-events-auto mt-4">
           <InputArea 
             onAnalyze={handleAnalyze} 
             isLoading={zen.uiState === UIState.BREATHING_IN} 
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