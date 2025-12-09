import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { generateZenGuidance, generateChatResponse } from '../services/geminiService';
import { ZenResponse, UIState, ChatMessage, Language, UrgencyLevel } from '../types';
import { TRANSLATIONS } from '../constants';

interface UseZenModeProps {
  apiKey: string | null;
  language: Language;
  onActionIntent?: (intent: string) => void;
  onTts?: (text: string) => void;
}

export const useZenMode = ({ apiKey, language, onActionIntent, onTts }: UseZenModeProps) => {
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [zenData, setZenData] = useState<ZenResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [thoughtTrace, setThoughtTrace] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]); // Context memory for Zen mode

  const thinkingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const t = TRANSLATIONS[language];

  // Load history from local storage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('mindful_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Derive urgency from zenData
  const urgency: UrgencyLevel = useMemo(() => {
    if (!zenData) return 'low';
    const realm = zenData.realm.toLowerCase();
    const intent = zenData.action_intent;

    if (intent === 'PLAY_SOUND') return 'high';
    if (realm.includes('anxiety') || realm.includes('anger') || realm.includes('lo âu') || realm.includes('giận')) return 'high';
    if (intent === 'SET_ALARM') return 'medium';
    return 'low';
  }, [zenData]);

  const analyze = useCallback(async (
    text: string, 
    mode: 'ZEN' | 'CHAT', 
    options?: { image?: string | null, isVoice?: boolean, useSearch?: boolean }
  ) => {
    if (!apiKey) return;

    // --- CHAT MODE LOGIC ---
    if (mode === 'CHAT') {
        setUiState(UIState.CHATTING);
        const newUserMsg: ChatMessage = { role: 'user', text, image: options?.image };
        const updatedHistory = [...chatHistory, newUserMsg];
        setChatHistory(updatedHistory);

        try {
            const response = await generateChatResponse(
                updatedHistory, 
                text, 
                options?.image || null, 
                language, 
                options?.useSearch || false, 
                apiKey
            );
            const newModelMsg: ChatMessage = { 
                role: 'model', 
                text: response.text, 
                groundingMetadata: response.groundingMetadata 
            };
            setChatHistory([...updatedHistory, newModelMsg]);
            onTts?.(response.text);
        } catch (e) {
            console.error("Chat Error", e);
        }
        return;
    }

    // --- ZEN MODE LOGIC ---
    setUiState(UIState.BREATHING_IN);
    setZenData(null);
    
    // Start "Thinking" Monologue
    const thoughts = t.analyzing;
    setThoughtTrace(thoughts[0]);

    if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
    thinkingIntervalRef.current = setInterval(() => {
      setThoughtTrace((currentTrace) => {
        const currentTraceSafe = currentTrace || thoughts[0];
        const currentIndex = thoughts.indexOf(currentTraceSafe);
        const nextIndex = (currentIndex + 1) % thoughts.length;
        return thoughts[nextIndex];
      });
    }, 1500);

    try {
      const response = await generateZenGuidance(
          text, 
          language, 
          history, 
          options?.image, 
          options?.isVoice, 
          apiKey
      );
      
      // Stop thinking animation
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      
      // Show internal monologue thought if provided
      if (response.thought_trace) {
         setThoughtTrace(response.thought_trace);
         await new Promise(resolve => setTimeout(resolve, 1500));
      }

      setZenData(response);
      setUiState(UIState.SHOWING_WISDOM);
      
      // Trigger side effects
      onTts?.(response.advice);
      onActionIntent?.(response.action_intent);
      
      // Update history
      const newHistory = [...history, response.realm].slice(-5);
      setHistory(newHistory);
      localStorage.setItem('mindful_history', JSON.stringify(newHistory));

    } catch (error) {
      console.error(error);
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      setThoughtTrace(t.errorGeneric);
      setTimeout(() => setUiState(UIState.IDLE), 3000);
    }
  }, [apiKey, language, chatHistory, history, t, onActionIntent, onTts]);

  return {
    uiState,
    setUiState,
    zenData,
    chatHistory,
    setChatHistory,
    thoughtTrace,
    urgency,
    analyze
  };
};