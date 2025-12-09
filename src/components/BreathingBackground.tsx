import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../constants';
import { UrgencyLevel } from '../types';

interface BreathingBackgroundProps {
  isAccelerated: boolean; // True when AI is "thinking"
  urgency?: UrgencyLevel; // urgency level affects breathing pattern
}

const BreathingBackground: React.FC<BreathingBackgroundProps> = ({ isAccelerated, urgency = 'low' }) => {
  
  // Define animation configurations based on state
  const config = useMemo(() => {
    // 1. Thinking Mode
    if (isAccelerated) {
      return {
        duration: 2.5,
        scaleOuter: [0.8, 1.05, 0.8],
        opacityOuter: [0.3, 0.6, 0.3],
        times: [0, 0.5, 1],
        colorOuter: COLORS.SageGreen,
        colorInner: COLORS.RicePaperDark
      };
    }

    // 2. Breathing Modes
    switch (urgency) {
      case 'high':
        return {
          duration: 5,
          scaleOuter: [0.85, 1.15, 0.85],
          opacityOuter: [0.4, 0.65, 0.4],
          times: [0, 0.5, 1],
          colorOuter: '#E8A088',
          colorInner: '#F0EAE0'
        };

      case 'medium':
        return {
          duration: 16, 
          scaleOuter: [0.8, 1.2, 1.2, 0.8, 0.8],
          opacityOuter: [0.3, 0.6, 0.6, 0.3, 0.3],
          times: [0, 0.25, 0.5, 0.75, 1],
          colorOuter: COLORS.MonkRobe,
          colorInner: COLORS.SageGreen
        };

      case 'low':
      default:
        return {
          duration: 19,
          scaleOuter: [0.8, 1.25, 1.25, 0.8],
          opacityOuter: [0.25, 0.55, 0.55, 0.25],
          times: [0, 0.21, 0.58, 1],
          colorOuter: COLORS.MonkRobe,
          colorInner: COLORS.SageGreen
        };
    }
  }, [isAccelerated, urgency]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
      {/* Outer Aura (Ether) */}
      <motion.div
        className="absolute rounded-full"
        initial={false}
        animate={{
          scale: config.scaleOuter,
          opacity: config.opacityOuter,
          backgroundColor: config.colorOuter,
        }}
        transition={{
          duration: config.duration,
          ease: "easeInOut",
          times: config.times,
          repeat: Infinity,
        }}
        style={{
          width: '85vw',
          height: '85vw',
          filter: 'blur(100px)',
        }}
      />
      
      {/* Inner Core (Self) */}
      <motion.div
        className="absolute rounded-full"
        initial={false}
        animate={{
          scale: config.scaleOuter.map((s: number) => s * 0.7),
          opacity: config.opacityOuter.map((o: number) => o * 0.8),
          backgroundColor: config.colorInner,
        }}
        transition={{
          duration: config.duration,
          ease: "easeInOut",
          times: config.times,
          repeat: Infinity,
          delay: isAccelerated ? 0.2 : 1.0,
        }}
        style={{
          width: '50vw',
          height: '50vw',
          filter: 'blur(80px)',
        }}
      />
    </div>
  );
};

export default BreathingBackground;