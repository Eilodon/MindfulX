
import React, { useEffect, useRef } from 'react';

interface AudioPlayerProps {
  isPlaying: boolean;
  volume: number;
  url: string; // "synth:rain" | "synth:bowl" | "synth:wind"
  onError?: () => void;
}

// 🛡️ ROBUSTNESS: Web Audio API Engine
// Generates sound mathematically to avoid network/format errors.
class ZenSynth {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  activeNodes: AudioNode[] = [];
  currentType: string | null = null;

  constructor() {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
  }

  setVolume(val: number) {
    if (this.masterGain) {
      // Smooth volume transition
      this.masterGain.gain.setTargetAtTime(val, this.ctx?.currentTime || 0, 0.1);
    }
  }

  stop() {
    this.activeNodes.forEach(node => {
      try {
        (node as any).stop?.();
        node.disconnect();
      } catch (e) { /* ignore */ }
    });
    this.activeNodes = [];
    this.currentType = null;
  }

  // --- SYNTHESIS ALGORITHMS ---

  // 1. Pink Noise (Rain)
  createPinkNoise() {
    if (!this.ctx) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168981;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // Compensate for gain
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    return noise;
  }

  // 2. Brown Noise (Wind/Ocean)
  createBrownNoise() {
    if (!this.ctx) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Compensate for gain
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    return noise;
  }

  play(type: string) {
    if (!this.ctx || !this.masterGain) return;
    if (this.currentType === type) return;

    this.stop(); // Stop previous
    this.currentType = type;

    // Resume context if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (type.includes('rain')) {
      const noise = this.createPinkNoise();
      if (!noise) return;
      
      // Filter to soften the rain
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      
      noise.connect(filter);
      filter.connect(this.masterGain);
      noise.start();
      this.activeNodes.push(noise, filter);

    } else if (type.includes('wind')) {
      const noise = this.createBrownNoise();
      if (!noise) return;
      
      // Dynamic filter to simulate wind gusts
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      // LFO for "movement"
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1; // Slow cycle
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 300; // Modulate frequency by 300hz

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      
      noise.connect(filter);
      filter.connect(this.masterGain);
      noise.start();
      lfo.start();
      this.activeNodes.push(noise, filter, lfo, lfoGain);

    } else if (type.includes('bowl')) {
      // Singing Bowl: Multiple sine waves
      const baseFreq = 180; // F3 approx
      const harmonics = [1, 1.5, 2.02, 3.5]; // Inharmonic ratios
      
      harmonics.forEach((ratio, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = baseFreq * ratio;
        
        // Lower volume for higher harmonics
        gain.gain.value = (0.3 / (i + 1)); 

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        this.activeNodes.push(osc, gain);
      });
    }
  }
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ isPlaying, volume, url }) => {
  const synthRef = useRef<ZenSynth | null>(null);

  useEffect(() => {
    synthRef.current = new ZenSynth();
    return () => {
      synthRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    const synth = synthRef.current;
    if (!synth) return;

    if (isPlaying) {
      // Extract 'rain' from 'synth:rain'
      const type = url.split(':')[1] || 'rain';
      synth.play(type);
    } else {
      synth.stop();
    }
  }, [isPlaying, url]);

  return null; // No visual UI needed
};

export default AudioPlayer;
