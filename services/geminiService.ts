
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { ZenResponse, Language } from "../types";

export const generateZenGuidance = async (userInput: string, language: Language): Promise<ZenResponse> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key not found. Please set process.env.API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Augment the prompt with language instruction
  const languageInstruction = language === 'vi' 
    ? "IMPORTANT: Provide 'advice', 'thought_trace', and 'realm' strictly in Vietnamese language." 
    : "IMPORTANT: Provide 'advice', 'thought_trace', and 'realm' strictly in English language.";

  const fullSystemPrompt = `${SYSTEM_PROMPT}\n${languageInstruction}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userInput,
      config: {
        systemInstruction: fullSystemPrompt,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("The Master is silent.");

    try {
      const parsed: ZenResponse = JSON.parse(text);
      return parsed;
    } catch (parseError) {
      console.error("JSON Parse Error", parseError);
      return {
        thought_trace: language === 'vi' ? "Gió đang đổi chiều..." : "The wind is changing...",
        realm: language === 'vi' ? "Cảnh giới Vô Thường" : "Unknown Realm",
        advice: language === 'vi' 
          ? "Hít vào, thở ra. Ngay cả khi tâm trí rối bời, hơi thở vẫn luôn ở đó."
          : "Breathe in, breathe out. Even when clarity is lost, the breath remains.",
        action_intent: "NONE"
      };
    }

  } catch (error) {
    console.error("Gemini API Error", error);
    throw error;
  }
};
