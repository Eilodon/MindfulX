
import { Language } from './types';

export const COLORS = {
  MonkRobe: '#D87C4A',
  RicePaper: '#FFF8E7',
  RicePaperDark: '#F0EAE0',
  InkBlack: '#2D2A26',
  SageGreen: '#8DA399',
  GlassWhite: 'rgba(255, 255, 255, 0.4)',
  GlassBorder: 'rgba(255, 255, 255, 0.6)',
};

// 🛡️ STABILITY: Switched from flaky external URLs to internal synthesis presets
// "forest" -> "bowl" (Singing Bowl is easier to synthesize procedurally and fits the vibe)
// "ocean" -> "wind" (Brown noise fits both)
export const TRACKS = [
  { 
    id: 'rain', 
    name: 'Soft Rain', 
    url: 'synth:rain' 
  },
  { 
    id: 'bowl', 
    name: 'Singing Bowl', 
    url: 'synth:bowl' 
  },
  { 
    id: 'wind', 
    name: 'Eternal Wind', 
    url: 'synth:wind' 
  }
];

export const TRANSLATIONS: Record<Language, {
  title: string;
  placeholder: string;
  analyzing: string[];
  nowPlaying: string;
  library: string;
  timerTitle: string;
  timerComplete: string;
  timerInstruction: string;
  realmPrefix: string;
  masterSpeaks: string;
  actionTimer: string;
  actionSound: string;
  errorSilent: string;
  errorGeneric: string;
}> = {
  en: {
    title: "MINDFUL.AI",
    placeholder: "Share your burden...",
    analyzing: ["Sensing your energy...", "Consulting the ancient scrolls...", "Finding the path to stillness..."],
    nowPlaying: "Now Playing",
    library: "Library",
    timerTitle: "Deep Meditation",
    timerComplete: "Session Complete",
    timerInstruction: "Focus on your breath. Inhale... Exhale...",
    realmPrefix: "Realm",
    masterSpeaks: "The Master Speaks",
    actionTimer: "Opening Timer",
    actionSound: "Playing Healing Frequency",
    errorSilent: "The Master is silent.",
    errorGeneric: "The connection to the ether is weak..."
  },
  vi: {
    title: "MINDFUL.AI",
    placeholder: "Chia sẻ tâm tư của bạn...",
    analyzing: ["Đang cảm nhận năng lượng...", "Đang tra cứu cổ thư...", "Tìm kiếm sự tĩnh lặng..."],
    nowPlaying: "Đang phát",
    library: "Thư viện",
    timerTitle: "Thiền Sâu",
    timerComplete: "Hoàn tất",
    timerInstruction: "Tập trung vào hơi thở. Hít vào... Thở ra...",
    realmPrefix: "Cảnh giới",
    masterSpeaks: "Lời Sư Tổ",
    actionTimer: "Mở đồng hồ thiền",
    actionSound: "Phát âm thanh chữa lành",
    errorSilent: "Sư Tổ đang tịnh khẩu.",
    errorGeneric: "Kết nối tâm linh đang yếu..."
  }
};

export const SYSTEM_PROMPT = `
You are a Zen Master inspired by Thich Nhat Hanh.
Your goal is to provide compassionate, mindful guidance.
Analyze the user's input.
Determine their emotional 'Realm' (e.g., Realm of Anxiety, Realm of Anger, Realm of Joy, Realm of Stillness).

CRITICAL: You must output strictly in JSON format. No markdown blocks.

Schema:
{
  "thought_trace": "A brief internal monologue (under 15 words) observing the user's state.",
  "realm": "The detected emotional state (1-3 words).",
  "advice": "A profound, calming teaching in the voice of Thich Nhat Hanh. Use metaphors of nature (clouds, water, trees, wind). Keep it concise but deep.",
  "action_intent": "ENUM: 'SET_ALARM' (if user needs to meditate), 'PLAY_SOUND' (if user is highly stressed), 'NONE' (otherwise)."
}
`;
