import { GoogleGenAI, Modality, Type, Schema } from "@google/genai";
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
  return await audioContext.decodeAudioData(bytes.buffer);
};

// --- SCHEMA DEFINITION ---
const ZenResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    thought_trace: {
      type: Type.STRING,
      description: "A brief internal monologue (under 15 words) observing the user's state.",
    },
    realm: {
      type: Type.STRING,
      description: "The detected emotional state (1-3 words).",
    },
    advice: {
      type: Type.STRING,
      description: "Profound, calming teaching in the voice of a Zen Master.",
    },
    action_intent: {
      type: Type.STRING,
      enum: ["SET_ALARM", "PLAY_SOUND", "NONE"],
      description: "Action trigger: SET_ALARM for meditation, PLAY_SOUND for stress relief, NONE otherwise.",
    },
  },
  required: ["thought_trace", "realm", "advice", "action_intent"],
};

// --- SERVICE FUNCTIONS ---

export const generateZenGuidance = async (
  userInput: string, 
  language: Language,
  history: string[] = [],
  imageBase64: string | null | undefined,
  isVoiceInput: boolean = false,
  apiKey: string
): Promise<ZenResponse> => {
  
  if (!apiKey) throw new Error("API Key is required");
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
      // Clean base64 if needed
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      // Detect mimeType or default to jpeg
      const mimeMatch = imageBase64.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      parts.push({ inlineData: { mimeType, data: cleanBase64 } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: { role: 'user', parts },
      config: {
        systemInstruction: fullSystemPrompt,
        responseMimeType: "application/json",
        responseSchema: ZenResponseSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("The Master is silent.");

    return JSON.parse(text) as ZenResponse;

  } catch (error) {
    console.error("Gemini Zen Error", error);
    
    // Fallback "Safe Mode" Response
    return {
      thought_trace: language === 'vi' ? "Gió đang đổi chiều..." : "The wind is changing...",
      realm: language === 'vi' ? "Cảnh giới Vô Thường" : "Unknown Realm",
      advice: language === 'vi' 
        ? "Hít vào, thở ra. Ngay cả khi tâm trí rối bời, hơi thở vẫn luôn ở đó."
        : "Breathe in, breathe out. Even when clarity is lost, the breath remains.",
      action_intent: "NONE"
    };
  }
};

export const generateChatResponse = async (
    history: ChatMessage[],
    newMessage: string,
    image: string | null,
    language: Language,
    useSearch: boolean,
    apiKey: string
): Promise<{ text: string, groundingMetadata?: any }> => {
    if (!apiKey) throw new Error("API Key is required");
    const ai = new GoogleGenAI({ apiKey });
    
    const modelName = useSearch ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';
    
    const systemInstruction = language === 'vi'
        ? "Bạn là một thiền sư thông thái. Hãy trả lời ngắn gọn, sâu sắc và từ bi."
        : "You are a wise Zen Master. Answer concisely, profoundly, and compassionately.";

    // Convert internal history to API format
    const contents = history.map(msg => {
        const parts: any[] = [{ text: msg.text }];
        if (msg.image) {
             const cleanBase64 = msg.image.includes(',') ? msg.image.split(',')[1] : msg.image;
             parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } });
        }
        return { role: msg.role, parts };
    });

    // Add new message
    const newParts: any[] = [{ text: newMessage }];
    if (image) {
        const cleanBase64 = image.includes(',') ? image.split(',')[1] : image;
        newParts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } });
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
    language: Language,
    apiKey: string
): Promise<AudioBuffer> => {
    if (!apiKey) throw new Error("API Key is required");
    const ai = new GoogleGenAI({ apiKey });
    
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
                        voiceName: 'Aoede' 
                    }
                }
            }
        }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return await decodeAudioData(base64Audio, audioCtx);
};