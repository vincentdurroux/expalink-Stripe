import { GoogleGenAI, Type } from "@google/genai";
import { SearchFilters, Professional } from '../types';
import { supabase } from '../supabaseClient';

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export interface AIAssistanceResponse {
  answer: string;
  suggestions: {
    profession: string;
    city?: string;
  }[];
  recommendedProIds: string[];
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 2, initialDelay = 1000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorMsg = err?.message || '';
      const isRetryable = errorMsg.includes('503') || errorMsg.includes('429') || err?.status === 503 || err?.status === 429;
      if (!isRetryable || i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, i)));
    }
  }
  throw lastError;
};

/**
 * Appelle l'IA pour l'assistance conversationnelle.
 */
export const getAIAssistance = async (
  query: string, 
  availablePros: Professional[], 
  language: string,
  history: ChatHistoryItem[] = [],
  preferredCity?: string
): Promise<AIAssistanceResponse> => {
  const langMap: Record<string, string> = {
    en: 'English', fr: 'French', es: 'Spanish'
  };
  const targetLanguage = langMap[language.split('-')[0]] || 'English';

  let filteredPros = availablePros;
  if (preferredCity) {
    const cityLower = preferredCity.toLowerCase();
    filteredPros = availablePros.filter(p => 
      p.cities?.some(c => c.toLowerCase().includes(cityLower)) ||
      p.address?.toLowerCase().includes(cityLower)
    );
  }
  
  if (filteredPros.length < 15) {
    const others = availablePros.filter(p => !filteredPros.includes(p));
    filteredPros = [...filteredPros, ...others.slice(0, 20 - filteredPros.length)];
  }

  const prosContext = filteredPros.slice(0, 25).map(p => ({
    id: p.id,
    j: p.professions?.[0], 
    s: p.specialties?.slice(0, 4), 
    l: p.languages,
    a: p.address,
    cc: p.cities,
    r: p.rating,
    x: p.yearsOfExperience
  }));

  const contents = [
    ...history.slice(-6), 
    { role: 'user' as const, parts: [{ text: query }] }
  ];

  try {
    const ai = getAIClient();
    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: `You are ExpaLink AI, a premium concierge for expats in Spain. Context: ${JSON.stringify(prosContext)}. 
          - RULE: Do not mention pro names. Refer to them as "a specialist" or "this expert".
          - LANGUAGE: Reply in ${targetLanguage}.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: { type: Type.STRING },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    profession: { type: Type.STRING },
                    city: { type: Type.STRING, nullable: true }
                  }
                }
              },
              recommendedProIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['answer', 'suggestions', 'recommendedProIds']
          }
        }
      });
    });

    const data = JSON.parse(response.text || '{}');
    return {
      answer: data.answer || "I found some experts for you.",
      suggestions: data.suggestions || [],
      recommendedProIds: data.recommendedProIds || []
    };
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return { 
      answer: "I'm having a bit of trouble connecting to my brain right now. Please try again in a moment.", 
      suggestions: [], 
      recommendedProIds: [] 
    };
  }
};

/**
 * Traduit automatiquement la biographie et les spécialités d'un professionnel dans les 3 langues sélectionnées.
 */
export const translateProfile = async (bio: string, specialties: string[] = []) => {
  const supportedLanguages = ['en', 'fr', 'es'];
  
  const fallback = { 
    bios: supportedLanguages.reduce((acc, l) => ({ ...acc, [l]: bio }), {}),
    specialtyTranslations: supportedLanguages.reduce((acc, l) => ({ 
      ...acc, 
      [l]: specialties.reduce((sAcc, s) => ({ ...sAcc, [s]: s }), {}) 
    }), {})
  };

  if ((!bio || bio.length < 10) && specialties.length === 0) return fallback;

  try {
    const ai = getAIClient();
    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the following professional bio and specialties into these 3 languages: English (en), French (fr), Spanish (es).
        
        BIO: "${bio}"
        SPECIALTIES: ${JSON.stringify(specialties)}
        
        Return a JSON object with:
        1. "bios": an object where keys are language codes (en, fr, es) and values are the translated bio text.
        2. "specialtyList": an array of objects { original, en, fr, es }.`,
        config: { 
          systemInstruction: "You are a professional translator for a premium business directory. Ensure professional tone and accurate local terminology. Return strictly valid JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bios: { 
                type: Type.OBJECT, 
                properties: { 
                  en: { type: Type.STRING }, 
                  fr: { type: Type.STRING }, 
                  es: { type: Type.STRING }
                }, 
                required: ['en', 'fr', 'es'] 
              },
              specialtyList: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { 
                    original: { type: Type.STRING }, 
                    en: { type: Type.STRING }, 
                    fr: { type: Type.STRING }, 
                    es: { type: Type.STRING }
                  }, 
                  required: ['original', 'en', 'fr', 'es'] 
                } 
              }
            },
            required: ['bios', 'specialtyList']
          }
        }
      });
    });

    const data = JSON.parse(response.text || '{}');
    
    // Reconstruction de specialtyTranslations au format Record<lang, Record<original, translated>>
    const specialtyTranslations: Record<string, Record<string, string>> = {};
    supportedLanguages.forEach(lang => {
      specialtyTranslations[lang] = {};
    });

    if (data.specialtyList) {
      data.specialtyList.forEach((item: any) => {
        const orig = item.original;
        supportedLanguages.forEach(lang => {
          specialtyTranslations[lang][orig] = item[lang] || orig;
        });
      });
    }

    return { 
      bios: data.bios || fallback.bios, 
      specialtyTranslations 
    };
  } catch (e) {
    console.error("AI Translation Error, using fallback:", e);
    return fallback;
  }
};