
import React, { useState } from 'react';
import { ArrowUp, Loader2, Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface InputAreaProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
  language: Language;
}

const InputArea: React.FC<InputAreaProps> = ({ onAnalyze, isLoading, language }) => {
  const [text, setText] = useState('');
  const t = TRANSLATIONS[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onAnalyze(text);
      setText('');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form 
        onSubmit={handleSubmit}
        className="relative flex items-center p-2 rounded-full transition-all duration-300 focus-within:ring-2 focus-within:ring-[#D87C4A]/30 focus-within:shadow-lg backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.8)'
        }}
      >
        <div className="pl-4 pr-2">
            <Sparkles className="w-5 h-5 text-[#8DA399]" />
        </div>
        
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-[#2D2A26] placeholder-[#2D2A26]/40 text-lg py-3 font-light"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className={`
            p-3 rounded-full transition-all duration-300 ml-2
            ${text.trim() && !isLoading ? 'bg-[#D87C4A] text-white shadow-md hover:shadow-lg transform hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
          `}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowUp className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default InputArea;
