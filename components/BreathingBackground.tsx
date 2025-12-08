
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../constants';

export type UrgencyLevel = 'low' | 'medium' | 'high';

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
        // "Resonant Coherence" / Alert State
        // Faster, continuous flow to match high energy, then stabilize.
        // Approx 5-6s breath cycle (standard coherent breathing is ~5.5s)
        return {
          duration: 5,
          scaleOuter: [0.85, 1.15, 0.85],
          opacityOuter: [0.4, 0.65, 0.4],
          times: [0, 0.5, 1], // Simple In/Out sine wave
          colorOuter: '#E8A088', // Terra cotta for energy
          colorInner: '#F0EAE0'
        };

      case 'medium':
        // "Box Breathing" (Sama Vritti)
        // Ratio: 4:4:4:4 (In, Hold, Out, Hold)
        // Total cycle units: 16.
        // Times mapping: 0 -> 0.25 (In), 0.25 -> 0.5 (Hold), 0.5 -> 0.75 (Out), 0.75 -> 1.0 (Hold)
        return {
          duration: 16, 
          scaleOuter: [0.8, 1.2, 1.2, 0.8, 0.8], // Expand -> Stay -> Contract -> Stay
          opacityOuter: [0.3, 0.6, 0.6, 0.3, 0.3],
          times: [0, 0.25, 0.5, 0.75, 1],
          colorOuter: COLORS.MonkRobe,
          colorInner: COLORS.SageGreen
        };

      case 'low':
      default:
        // "4-7-8 Relaxing Breath" (Dr. Weil)
        // Ratio: 4:7:8 (In, Hold, Out)
        // Total cycle units: 19.
        // Inhale (4/19 ≈ 0.21)
        // Hold (7/19 ≈ 0.37) -> Ends at 0.58
        // Exhale (8/19 ≈ 0.42) -> Ends at 1.0
        return {
          duration: 19,
          scaleOuter: [0.8, 1.25, 1.25, 0.8], // Expand -> Hold -> Contract
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
          scale: config.scaleOuter.map(s => s * 0.7), // Echoes the outer
          opacity: config.opacityOuter.map(o => o * 0.8),
          backgroundColor: config.colorInner,
        }}
        transition={{
          duration: config.duration,
          ease: "easeInOut",
          times: config.times,
          repeat: Infinity,
          delay: isAccelerated ? 0.2 : 1.0, // Slight organic delay for the core
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
