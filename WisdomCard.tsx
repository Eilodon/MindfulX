
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, TRANSLATIONS } from '../constants';
import { ZenResponse, Language } from '../types';
import { Wind, Bell, Music } from 'lucide-react';

interface WisdomCardProps {
  data: ZenResponse | null;
  thoughtTrace: string | null;
  isVisible: boolean;
  language: Language;
}

const WisdomCard: React.FC<WisdomCardProps> = ({ data, thoughtTrace, isVisible, language }) => {
  const isThinking = !data && thoughtTrace;
  const t = TRANSLATIONS[language];

  return (
    <AnimatePresence mode="wait">
      {(isVisible || isThinking) && (
        <motion.div
          key={data ? "wisdom" : "thinking"}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md mx-auto rounded-[32px] backdrop-blur-xl shadow-2xl overflow-hidden relative flex flex-col max-h-[70vh]"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.45)',
            border: `1px solid rgba(255, 255, 255, 0.6)`,
            boxShadow: '0 20px 40px rgba(216, 124, 74, 0.08)'
          }}
        >
          {/* Content Container */}
          <div className="flex flex-col items-center text-center relative z-10 p-8 w-full h-full">
            
            {/* State 1: Thinking / Monologue */}
            {isThinking && (
              <div className="flex flex-col items-center justify-center py-10 h-full">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="mb-6"
                >
                  <Wind className="w-8 h-8 text-[#8DA399] opacity-80" />
                </motion.div>
                <motion.p 
                  key={thoughtTrace}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-zen text-2xl italic text-[#D87C4A]"
                >
                  "{thoughtTrace}"
                </motion.p>
              </div>
            )}

            {/* State 2: Wisdom Revealed */}
            {data && (
              <div className="w-full flex flex-col h-full">
                {/* Header (Fixed) */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4 flex justify-center flex-shrink-0"
                >
                  <span 
                    className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border"
                    style={{ 
                      backgroundColor: 'rgba(216, 124, 74, 0.08)', 
                      color: COLORS.MonkRobe,
                      borderColor: 'rgba(216, 124, 74, 0.15)'
                    }}
                  >
                    {t.realmPrefix}: {data.realm}
                  </span>
                </motion.div>

                <div className="flex-shrink-0">
                  <p className="text-xs font-bold text-[#8DA399] uppercase tracking-wider mb-2">
                    {t.masterSpeaks}
                  </p>
                </div>

                {/* Scrollable Advice Text */}
                <div className="overflow-y-auto custom-scrollbar flex-grow pr-2 -mr-2 mb-6">
                  <h2 className="font-zen text-3xl leading-relaxed text-[#2D2A26] py-2">
                    {data.advice}
                  </h2>
                </div>

                {/* Footer / Action Indicator (Fixed) */}
                <div className="flex justify-center items-center space-x-4 border-t border-gray-200/30 pt-4 flex-shrink-0 mt-auto">
                  {data.action_intent === 'SET_ALARM' && (
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="flex items-center space-x-2 text-[#D87C4A] text-sm font-medium bg-orange-50 px-3 py-1 rounded-full"
                    >
                      <Bell className="w-4 h-4" />
                      <span>{t.actionTimer}</span>
                    </motion.div>
                  )}
                  {data.action_intent === 'PLAY_SOUND' && (
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="flex items-center space-x-2 text-[#8DA399] text-sm font-medium bg-green-50 px-3 py-1 rounded-full"
                    >
                      <Music className="w-4 h-4" />
                      <span>{t.actionSound}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WisdomCard;
