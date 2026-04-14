import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { item, type } = req.body;
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: API Key missing. Please set VITE_GEMINI_API_KEY in Vercel Environment Variables.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // gemini-2.0-flash is the current stable model
    const modelName = "gemini-2.0-flash";

    const variantStr = (item.variants && item.variants.length > 0)
      ? ` Variants: ${JSON.stringify(item.variants.map((v: any) => v.label))}`
      : "";

    const prompt = type === 'item'
      ? `Translate this restaurant menu item from Turkish to English and Arabic. Return ONLY a valid JSON object with keys: "name_en", "description_en", "name_ar", "description_ar"${item.variants?.length ? ', and "variants" array with objects containing "label_en" and "label_ar"' : ''}. Name: "${item.name}". Description: "${item.description || ''}"${variantStr}`
      : `Translate this restaurant category name from Turkish to English and Arabic. Return ONLY a valid JSON object with keys: "name_en", "name_ar". Category name: "${item.name}"`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    // Extract the text from the response properly before serializing
    const text = response.text;
    res.status(200).json({ text });
  } catch (error: any) {
    console.error("API Translation error:", JSON.stringify(error));
    res.status(500).json({ error: error.message || JSON.stringify(error) });
  }
}
