
import React, { useState, useRef } from 'react';
import { ArrowUp, Loader2, Sparkles, Mic, Image as ImageIcon, X, MessageCircle, Radio, Globe } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language, AppMode } from '../types';

// --- Type Definitions for Web Speech API ---
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item: (index: number) => SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item: (index: number) => SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

interface InputAreaProps {
  onAnalyze: (text: string, imageBase64?: string | null, isVoiceInput?: boolean) => void;
  isLoading: boolean;
  language: Language;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  useSearch: boolean;
  setUseSearch: (use: boolean) => void;
  onLiveStart: () => void;
  isLiveActive: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ 
    onAnalyze, isLoading, language, mode, setMode, 
    useSearch, setUseSearch, onLiveStart, isLiveActive 
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isVoiceDerived, setIsVoiceDerived] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const t = TRANSLATIONS[language];

  // --- Voice Logic (Standard) ---
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn("Speech Recognition API not supported in this browser.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'vi' ? 'vi-VN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setIsVoiceDerived(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (event.results.length > 0) {
            const transcript = event.results[0][0].transcript;
            setText((prev) => {
                const spacer = prev ? ' ' : '';
                return prev + spacer + transcript;
            });
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.error("Failed to start recognition", err);
        setIsListening(false);
      }
    }
  };

  // --- Vision Logic ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || selectedImage) && !isLoading) {
      onAnalyze(text, selectedImage, isVoiceDerived);
      setText('');
      setSelectedImage(null);
      setIsVoiceDerived(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      
      {/* --- MODE SWITCHER --- */}
      <div className="flex items-center space-x-2 mb-4 bg-white/30 backdrop-blur-md p-1 rounded-full border border-white/50 shadow-sm">
        <button 
            onClick={() => setMode('ZEN')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${mode === 'ZEN' ? 'bg-[#D87C4A] text-white shadow-md' : 'text-[#2D2A26]/70 hover:bg-white/40'}`}
        >
            Zen
        </button>
        <button 
            onClick={() => setMode('CHAT')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center space-x-1 ${mode === 'CHAT' ? 'bg-[#8DA399] text-white shadow-md' : 'text-[#2D2A26]/70 hover:bg-white/40'}`}
        >
            <MessageCircle className="w-3 h-3" />
            <span>Chat</span>
        </button>
        <button 
            onClick={onLiveStart}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center space-x-1 ${mode === 'LIVE' ? 'bg-red-500 text-white shadow-md animate-pulse' : 'text-[#2D2A26]/70 hover:bg-white/40'}`}
        >
            <Radio className="w-3 h-3" />
            <span>{isLiveActive ? 'Live' : 'Commune'}</span>
        </button>
      </div>

      {/* --- SEARCH TOGGLE (Chat Only) --- */}
      {mode === 'CHAT' && (
          <div className="mb-2 flex items-center space-x-2">
            <label className="flex items-center cursor-pointer space-x-2 text-xs font-medium text-[#2D2A26]/60 hover:text-[#2D2A26] transition-colors">
                <input 
                    type="checkbox" 
                    checked={useSearch} 
                    onChange={(e) => setUseSearch(e.target.checked)} 
                    className="hidden"
                />
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${useSearch ? 'bg-[#4285F4]' : 'bg-gray-300'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${useSearch ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <div className="flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <span>Search Grounding</span>
                </div>
            </label>
          </div>
      )}

      {/* Image Preview */}
      {selectedImage && (
        <div className="mb-3 relative group">
          <img 
            src={selectedImage} 
            alt="Upload Preview" 
            className="h-24 w-auto rounded-2xl border-2 border-white/50 shadow-xl object-cover"
          />
          <button onClick={removeImage} className="absolute -top-2 -right-2 bg-gray-800 text-white p-1.5 rounded-full shadow-md hover:bg-gray-700 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input Bar (Hidden in Live Mode) */}
      {mode !== 'LIVE' && (
      <form 
        onSubmit={handleSubmit}
        className="relative w-full flex items-center p-2 rounded-full transition-all duration-300 focus-within:ring-2 focus-within:ring-[#D87C4A]/30 focus-within:shadow-lg backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <div className="pl-3 pr-2 flex items-center">
            <Sparkles className="w-5 h-5 text-[#8DA399]" />
        </div>
        
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); setIsVoiceDerived(false); }}
          placeholder={selectedImage ? (language === 'vi' ? "Mô tả ảnh..." : "Describe image...") : (isListening ? (language === 'vi' ? "Đang nghe..." : "Listening...") : t.placeholder)}
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-[#2D2A26] placeholder-[#2D2A26]/40 text-lg py-3 font-light min-w-0"
        />

        <div className="flex items-center space-x-1 pr-1">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full hover:bg-black/5 text-[#2D2A26]/60 transition-colors active:scale-95">
            <ImageIcon className="w-5 h-5" />
          </button>

          <button type="button" onClick={toggleListening} className={`p-2.5 rounded-full transition-all active:scale-95 ${isListening ? 'bg-red-50 text-red-500 animate-pulse ring-1 ring-red-200' : 'hover:bg-black/5 text-[#2D2A26]/60'}`}>
            <Mic className={`w-5 h-5 ${isListening ? 'scale-110' : ''}`} />
          </button>

          <button type="submit" disabled={(!text.trim() && !selectedImage) || isLoading} className={`p-3 rounded-full transition-all duration-300 ml-1 ${(text.trim() || selectedImage) && !isLoading ? 'bg-[#D87C4A] text-white shadow-md hover:shadow-lg hover:bg-[#c06b3d] transform hover:-translate-y-0.5' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
          </button>
        </div>
      </form>
      )}

      {mode === 'LIVE' && (
          <div className="text-center p-4">
              <p className="text-sm text-[#2D2A26]/60 italic animate-pulse">
                 Listening to your presence...
              </p>
          </div>
      )}
    </div>
  );
};

export default InputArea;
