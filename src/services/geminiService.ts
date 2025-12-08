
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { ZenResponse, Language, ChatMessage } from "../types";

// --- HELPERS FOR AUDIO DECODING ---
const decodeAudioData = async (
  base64String: string, 
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  // Gemini TTS output is raw PCM 24kHz mono usually, but the API returns a container sometimes.
  // Ideally we use decodeAudioData on the array buffer.
  // However, the GenAI SDK for TTS returns specific encoded data.
  // For simplicity with standard formats (if requested) or raw, let's try standard decode first.
  
  // Note: If raw PCM is returned without header, standard decodeAudioData might fail. 
  // But standard gemini-2.5-flash-preview-tts often returns usable audio data or we configure it.
  // Let's assume standard behavior for now, or raw PCM decoding if needed.
  
  return await audioContext.decodeAudioData(bytes.buffer);
};


// --- SERVICE FUNCTIONS ---

export const generateZenGuidance = async (
  userInput: string, 
  language: Language,
  apiKey: string,
  history: string[] = [],
  imageBase64?: string | null,
  isVoiceInput: boolean = false
): Promise<ZenResponse> => {
  
  const ai = new GoogleGenAI({ apiKey });

  // Context Construction
  const historyContext = history.length > 0 
    ? `User's recent emotional journey: [${history.join(' -> ')}].`
    : "First interaction.";

  let modalityContext = isVoiceInput 
    ? "\nINPUT: Spoken (Treat as stream of consciousness)." 
    : "\nINPUT: Typed.";

  if (imageBase64) {
    modalityContext += "\nVISUAL: Image provided. Use 'Metaphorical Mirroring'.";
  }

  const languageInstruction = language === 'vi' 
    ? "OUTPUT: Vietnamese language only." 
    : "OUTPUT: English language only.";

  const fullSystemPrompt = `${SYSTEM_PROMPT}\n\nCONTEXT:\n${historyContext}\n${modalityContext}\n\n${languageInstruction}`;

  try {
    const parts: any[] = [{ text: userInput }];

    if (imageBase64) {
      const [header, data] = imageBase64.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
      parts.push({ inlineData: { mimeType, data } });
    }

    // FEATURE: Image Analysis using gemini-3-pro-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: { role: 'user', parts },
      config: {
        systemInstruction: fullSystemPrompt,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    let text = response.text;
    if (!text) throw new Error("The Master is silent.");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Zen Error", error);
    throw error;
  }
};

export const generateChatResponse = async (
    history: ChatMessage[],
    newMessage: string,
    image: string | null,
    apiKey: string,
    language: Language,
    useSearch: boolean
): Promise<{ text: string, groundingMetadata?: any }> => {
    const ai = new GoogleGenAI({ apiKey });
    
    // FEATURE: Search Grounding uses gemini-2.5-flash
    // FEATURE: Complex Chat uses gemini-3-pro-preview
    const modelName = useSearch ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';
    
    const systemInstruction = language === 'vi'
        ? "Bạn là một thiền sư thông thái. Hãy trả lời ngắn gọn, sâu sắc và từ bi."
        : "You are a wise Zen Master. Answer concisely, profoundly, and compassionately.";

    // Convert internal history to API format
    const contents = history.map(msg => ({
        role: msg.role,
        parts: msg.image 
            ? [{ text: msg.text }, { inlineData: { mimeType: 'image/jpeg', data: msg.image.split(',')[1] } }]
            : [{ text: msg.text }]
    }));

    // Add new message
    const newParts: any[] = [{ text: newMessage }];
    if (image) {
        newParts.push({ inlineData: { mimeType: 'image/jpeg', data: image.split(',')[1] } });
    }
    contents.push({ role: 'user', parts: newParts });

    const tools = useSearch ? [{ googleSearch: {} }] : undefined;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
            systemInstruction,
            tools: tools, 
        }
    });

    return {
        text: response.text || "",
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
};

export const generateSpeech = async (
    text: string, 
    apiKey: string,
    language: Language
): Promise<AudioBuffer> => {
    const ai = new GoogleGenAI({ apiKey });
    
    // FEATURE: Text-to-Speech using gemini-2.5-flash-preview-tts
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: {
            role: 'user',
            parts: [{ text: text }]
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        // Aoede is calm/deep, good for Zen. 
                        // Using 'Kore' or 'Fenrir' as alternatives if needed.
                        voiceName: 'Aoede' 
                    }
                }
            }
        }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // For the specific TTS model, we might need to handle raw PCM or encoded. 
    // The current preview usually returns a format decodeAudioData handles (WAV container wrapped).
    return await decodeAudioData(base64Audio, audioCtx);
};
