import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { item, type } = req.body;
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: API Key missing' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = "gemini-3-flash-preview";
    
    const variantStr = (item.variants && item.variants.length > 0) 
      ? ` Variants: JSON array ${JSON.stringify(item.variants.map(v => v.label))}` 
      : "";
      
    const prompt = type === 'item' ?
      `Translate this menu item from Turkish to English and Arabic. Return JSON with exactly these keys: "name_en", "description_en", "name_ar", "description_ar", and if variants are provided, provide "variants" array with objects containing "label_en", "label_ar". Name: "${item.name}". Description: "${item.description || ''}"${variantStr}` :
      `Translate this category from Turkish to English and Arabic. Return JSON with exactly these keys: "name_en", "name_ar". Name: "${item.name}"`;

    const itemProps: any = { 
      name_en: { type: Type.STRING }, 
      description_en: { type: Type.STRING }, 
      name_ar: { type: Type.STRING }, 
      description_ar: { type: Type.STRING } 
    };

    if (item.variants && item.variants.length > 0) {
       itemProps.variants = {
         type: Type.ARRAY,
         items: {
           type: Type.OBJECT,
           properties: {
             label_en: { type: Type.STRING },
             label_ar: { type: Type.STRING }
           }
         }
       };
    }

    const schema = type === 'item' ? {
      type: Type.OBJECT,
      properties: itemProps,
      required: ["name_en", "description_en", "name_ar", "description_ar"]
    } : {
      type: Type.OBJECT,
      properties: { name_en: { type: Type.STRING }, name_ar: { type: Type.STRING } },
      required: ["name_en", "name_ar"]
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [prompt],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("API Translation error:", error);
    res.status(500).json({ error: error.message });
  }
}
