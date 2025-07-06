
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Tip } from '../types';

let ai: GoogleGenAI | null = null;
let isInitialized = false;

const getAiClient = (): GoogleGenAI | null => {
    if (!isInitialized) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
        
        if (apiKey) {
            ai = new GoogleGenAI({ apiKey });
        } else {
            console.warn("VITE_GEMINI_API_KEY environment variable not set. AI features are disabled.");
        }
        isInitialized = true;
    }
    return ai;
};

export const generateThankYouNote = async (tip: Tip): Promise<string> => {
  const client = getAiClient();
  if (!client) {
      return "Thank you so much for your generous tip! I truly appreciate it.";
  }
  
  try {
    const prompt = `A customer named ${tip.customerName} left a tip of $${tip.amount.toFixed(2)} with the message: "${tip.message}". Write a short, friendly, and sincere thank you note back to them. Keep it under 40 words.`;
    
    const response: GenerateContentResponse = await client.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating thank you note with Gemini:", error);
    return "Thank you so much for your generous tip! I truly appreciate it.";
  }
};
