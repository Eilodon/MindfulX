
export interface ZenResponse {
  thought_trace: string;
  realm: string;
  advice: string;
  action_intent: 'SET_ALARM' | 'PLAY_SOUND' | 'NONE';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string | null;
  groundingMetadata?: GroundingMetadata;
}

export interface GroundingMetadata {
  groundingChunks: {
    web?: {
      uri: string;
      title: string;
    };
  }[];
}

export enum UIState {
  IDLE = 'IDLE',
  BREATHING_IN = 'BREATHING_IN', // Simulating the "Thinking" phase
  SHOWING_WISDOM = 'SHOWING_WISDOM',
  CHATTING = 'CHATTING',
  LIVE_SESSION = 'LIVE_SESSION',
}

export type Language = 'en' | 'vi';

export type AppMode = 'ZEN' | 'CHAT' | 'LIVE';

export type UrgencyLevel = 'low' | 'medium' | 'high';
