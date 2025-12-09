import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Lock, ArrowRight, ExternalLink, AlertCircle } from 'lucide-react';
import { COLORS } from '../constants';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim().length < 10) {
      setError('Invalid API Key. Please check and try again.');
      return;
    }
    onSave(inputKey.trim());
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(45, 42, 38, 0.4)' }} // InkBlack with opacity
        >
          {/* Backdrop Blur */}
          <div className="absolute inset-0 backdrop-blur-md" />

          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              border: `1px solid ${COLORS.RicePaperDark}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-orange-100/50">
                  <Lock className="w-8 h-8 text-[#D87C4A]" />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-center mb-2 text-[#2D2A26]">
                Enter the Sanctuary
              </h2>
              <p className="text-center text-sm text-[#8DA399] mb-8 font-medium">
                To consult the Master, a key is required.
              </p>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="relative">
                  <Key className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => {
                        setInputKey(e.target.value);
                        setError('');
                    }}
                    placeholder="Paste your Gemini API Key"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-[#D87C4A] focus:ring-2 focus:ring-[#D87C4A]/20 outline-none transition-all text-[#2D2A26] placeholder-gray-400"
                  />
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center space-x-2 text-red-500 text-xs px-2"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={!inputKey}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-[#D87C4A] hover:bg-[#c06b3d] text-white font-medium transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
                >
                  <span>Begin Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-gray-500 hover:text-[#D87C4A] transition-colors"
                >
                  <span>Get your free Gemini API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            
            {/* Decorative bottom bar */}
            <div className="h-2 w-full bg-gradient-to-r from-[#8DA399] via-[#D87C4A] to-[#8DA399] opacity-30" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ApiKeyModal;