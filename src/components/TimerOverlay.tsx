import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { COLORS, TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface TimerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  durationSeconds?: number;
  language: Language;
}

// Cast motion components to any to avoid strict type checking issues with IntrinsicAttributes in some environments
const MotionDiv = motion.div as any;

const TimerOverlay: React.FC<TimerOverlayProps> = ({ isOpen, onClose, durationSeconds = 300, language }) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(durationSeconds);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, durationSeconds]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-2xl"
          style={{ backgroundColor: 'rgba(255, 248, 231, 0.9)' }}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <X className="w-8 h-8" style={{ color: COLORS.InkBlack }} />
          </button>

          <MotionDiv
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="flex flex-col items-center text-center"
          >
            <h2 className="text-xl font-medium tracking-widest uppercase mb-8" style={{ color: COLORS.MonkRobe }}>
              {t.timerTitle}
            </h2>

            {/* Breathing Circle Indicator */}
            <div className="relative flex items-center justify-center w-80 h-80 mb-8">
              <MotionDiv
                className="absolute inset-0 rounded-full opacity-20"
                style={{ backgroundColor: COLORS.SageGreen }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
               <MotionDiv
                className="absolute inset-4 rounded-full border-2 opacity-30"
                style={{ borderColor: COLORS.MonkRobe }}
                animate={{ scale: [1, 1.05, 1], rotate: 180 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="font-zen text-8xl" style={{ color: COLORS.InkBlack }}>
                {formatTime(timeLeft)}
              </div>
            </div>

            <p className="text-lg opacity-60 font-light max-w-xs" style={{ color: COLORS.InkBlack }}>
              {timeLeft === 0 ? t.timerComplete : t.timerInstruction}
            </p>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default TimerOverlay;