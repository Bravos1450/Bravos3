
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Tip } from '../types';

let ai: GoogleGenAI | null = null;
let isInitialized = false;

// This service is designed to be gracefully disabled if the API key is not provided.
const getAiClient = (): GoogleGenAI | null => {
    if (!isInitialized) {
        // IMPORTANT: The application expects the Gemini API key to be set in an environment variable named `GEMINI_API_KEY`.
        const apiKey = process.env.GEMINI_API_KEY; 
        
        if (apiKey) {
            ai = new GoogleGenAI({ apiKey });
        } else {
            console.warn("GEMINI_API_KEY environment variable not set. AI features are disabled.");
        }
        isInitialized = true; // Mark as initialized even if key is missing to prevent re-checking.
    }
    return ai;
};

export const generateThankYouNote = async (tip: Tip): Promise<string> => {
  const client = getAiClient();
  // If the client is not available (key is missing), return a default message.
  if (!client) {
      // This fallback ensures the app works without AI configuration.
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
    // Provide a fallback message in case the API call fails.
    return "Thank you so much for your generous tip! I truly appreciate it.";
  }
};
