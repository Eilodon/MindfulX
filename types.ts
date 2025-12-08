
export interface ZenResponse {
  thought_trace: string;
  realm: string;
  advice: string;
  action_intent: 'SET_ALARM' | 'PLAY_SOUND' | 'NONE';
}

export enum UIState {
  IDLE = 'IDLE',
  BREATHING_IN = 'BREATHING_IN', // Simulating the "Thinking" phase
  SHOWING_WISDOM = 'SHOWING_WISDOM',
}

export type Language = 'en' | 'vi';
