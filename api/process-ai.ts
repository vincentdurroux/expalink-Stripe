import { GoogleGenAI, Type } from "@google/genai";

/**
 * Handle AI processing requests locally using Gemini 3 Flash.
 * Strictly supports the 3 selector languages: en, fr, es.
 */
export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { task, text, filters, specialties } = await req.json();
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let systemInstruction = "You are ExpaLink AI, a premium relocation assistant.";
    let prompt = text;
    let responseMimeType = "text/plain";
    let responseSchema = undefined;

    if (task === 'assistance') {
      systemInstruction = "You are an expert relocation assistant for expats. Respond concisely, warmly, and practically in the user's language.";
      prompt = `Respond to this expat question: ${text}`;
    } 
    else if (task === 'translation') {
      systemInstruction = "You are an expert translator. Translate the provided bio and specialties into EXACTLY these 3 languages: en, fr, es. ALWAYS return a valid JSON object matching the requested schema.";
      responseMimeType = "application/json";
      prompt = `Translate this bio: "${text}" and these specialties: ${JSON.stringify(specialties)} into en, fr, es.`;
      
      responseSchema = {
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
          specialtyTranslations: {
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
        required: ['bios', 'specialtyTranslations']
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType,
        responseSchema
      },
    });

    return new Response(
      task === 'translation' ? response.text : JSON.stringify({ response: response.text }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        } 
      }
    );

  } catch (error: any) {
    console.error("Internal AI Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'AI processing failed' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}