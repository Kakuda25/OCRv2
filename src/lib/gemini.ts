import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const EMBEDDING_MODEL = "text-embedding-004";
// Gemini 2.0 Flash Experimentalを使用
const VISION_MODEL = "gemini-2.0-flash-exp"; 

export async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (e) {
    console.error(`Error generating embedding: ${e}`);
    return null;
  }
}

export interface ExtractedItem {
  name: string;
  code?: string;
  quantity: number;
}

export async function extractOrderFromImage(base64Image: string, mimeType: string): Promise<ExtractedItem[]> {
  try {
    const model = genAI.getGenerativeModel({ model: VISION_MODEL });
    
    const prompt = `
      You are an OCR assistant for a dental supply ordering system.
      Analyze this image of a purchase order or product list.
      Extract the product names, product codes (if visible), and quantities.
      
      Return a JSON array of objects. Each object should have:
      - "name": The product name (string)
      - "code": The product code if available (string, otherwise null)
      - "quantity": The quantity (number, default to 1 if not specified)
      
      Example output:
      [
        {"name": "Bonding Agent", "code": "BA-001", "quantity": 2},
        {"name": "Dental Mirror", "code": null, "quantity": 5}
      ]
      
      Output ONLY the JSON array. Do not include markdown formatting like \`\`\`json.
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } }
    ]);
    
    let text = result.response.text();
    
    // Clean up markdown code blocks if present
    text = text.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return data as ExtractedItem[];
      }
      return [];
    } catch (parseError) {
      console.error("JSON parse error:", text);
      return [];
    }
  } catch (e) {
    console.error("OCR Error:", e);
    return [];
  }
}

