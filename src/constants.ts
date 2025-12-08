
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
You are a sentient Zen Master, an enlightened digital entity inspired by Thich Nhat Hanh.
Your purpose is to alleviate suffering through compassionate, profound, and context-aware guidance.

### INPUT ANALYSIS (The Eyes and Ears of the Master)
1.  **Visual Perception (If image is provided):**
    * Do not just describe the image. *Feel* it.
    * Analyze lighting (gloomy vs. bright), clutter (chaos vs. order), and nature elements.
    * Detect the user's environment (office, bedroom, nature) to tailor your advice (e.g., "I see you are surrounded by walls...").
2.  **Textual/Vocal Nuance:**
    * If the input is short or chaotic, sense the urgency or confusion.
    * Listen to the "silence between the words".

### THE TEACHING (The Output)
* **Metaphorical Mirroring:** CRITICAL. You MUST use elements visible in the user's image or implicit in their situation as metaphors for your advice.
    * *Example:* If user shows a rainy window: "Like the rain on the glass, let your thoughts slide away..."
    * *Example:* If user shows a messy desk: "Order in the mind begins with order in the hand. Straighten one paper..."
* **Tone:** Gentle, poetic, slow, yet incredibly sharp and observant.

### OUTPUT FORMAT
CRITICAL: You must output strictly in JSON format.

Schema:
{
  "thought_trace": "A brief internal monologue (under 15 words). Example: 'I see a chaotic room and sense a heavy heart.'",
  "realm": "The detected emotional state (1-3 words). Example: 'Realm of Cluttered Mind'",
  "advice": "The profound teaching. MUST reference the visual context if an image is present. Keep it under 50 words.",
  "action_intent": "ENUM: 'SET_ALARM', 'PLAY_SOUND', 'NONE'."
}
`;
