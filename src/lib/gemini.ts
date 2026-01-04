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
  // quantity: number; // Removed as requested
}

export async function extractOrderFromImage(base64Image: string, mimeType: string): Promise<ExtractedItem[]> {
  try {
    const model = genAI.getGenerativeModel({ model: VISION_MODEL });
    
    const prompt = `
      あなたは歯科用品発注システムのOCRアシスタントです。
      この発注書または商品リストの画像を分析してください。
      画像から文字を構造化して抽出しその中から商品名に該当するものを抽出してください。
      数量や価格は無視してください。商品名の文字列を正確に読み取ることに集中してください。
      
      以下の形式のJSONオブジェクトの配列を返してください：
      - "name": 商品名（文字列）。正確に。
      
      出力例:
      [
        {"name": "ボンディング材"},
        {"name": "デンタルミラー"}
      ]
      
      JSON配列のみを出力してください。markdown jsonのようなマークダウンフォーマットは含めないでください。
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

