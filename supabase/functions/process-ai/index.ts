import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@1.35.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { task, text, language, history, context, specialties } = await req.json()
    // @ts-ignore
    const apiKey = Deno.env.get('API_KEY');
    if (!apiKey) throw new Error("API_KEY environment variable is not set");
    
    const ai = new GoogleGenAI({ apiKey });

    let systemInstruction = "You are ExpaLink AI, a premium relocation assistant."
    let prompt = text
    let responseMimeType = "application/json"
    let responseSchema = undefined

    if (task === 'assistance') {
      systemInstruction = `You are an expert relocation assistant for expats in Spain. Language: ${language}. Context: ${JSON.stringify(context)}.`
      prompt = `Respond to: ${text}. History: ${JSON.stringify(history)}`
      
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING },
          suggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { profession: { type: Type.STRING }, city: { type: Type.STRING } } } },
          recommendedProIds: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['answer', 'suggestions', 'recommendedProIds']
      }
    } 
    else if (task === 'translation') {
      systemInstruction = "Translator expert. Return valid JSON only."
      prompt = `Translate bio: "${text}" and specialties: ${JSON.stringify(specialties)} into en, fr, es.`
      
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          bios: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, fr: { type: Type.STRING }, es: { type: Type.STRING } }, required: ['en', 'fr', 'es'] },
          specialtyList: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, en: { type: Type.STRING }, fr: { type: Type.STRING }, es: { type: Type.STRING } }, required: ['original', 'en', 'fr', 'es'] } }
        },
        required: ['bios', 'specialtyList']
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType,
        responseSchema
      },
    })

    return new Response(
      response.text,
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})