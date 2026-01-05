import { NextRequest, NextResponse } from 'next/server';
import { extractOrderFromImage, getEmbedding } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { TaskType } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // File to Base64
    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = file.type;

    // 1. OCR execution
    console.log('Starting OCR...');
    const extractedItems = await extractOrderFromImage(base64Image, mimeType);
    console.log(`OCR found ${extractedItems.length} items.`);

    // 2. Search for similar products for each item
    const results = await Promise.all(extractedItems.map(async (item) => {
      let candidates: any[] = [];
      const trimmedName = item.name ? item.name.trim() : '';
      
      // 2a. Text Match Search (Partial match receives 1.0 similarity)
      if (trimmedName) {
        try {
          const textMatches = await prisma.product.findMany({
            where: {
              name: {
                contains: trimmedName,
                mode: 'insensitive' // Ignore case
              }
            },
            take: 3
          });

          if (textMatches.length > 0) {
            candidates = textMatches.map(c => ({
              id: c.id,
              productCode: c.productCode,
              name: c.name,
              price: Number(c.price),
              description: c.description,
              imageUrl: c.imageUrl,
              similarity: 1.0 // Text match treated as high confidence
            }));
          }
        } catch (e) {
          console.error("Text search error:", e);
        }
      }
      
      if (item.name) {
        // Generate embedding for the extracted product name
        // Use RETRIEVAL_QUERY for search queries
        const embedding = await getEmbedding(item.name, TaskType.RETRIEVAL_QUERY);
        
        if (embedding) {
          const vectorStr = `[${embedding.join(',')}]`;
          
          // Vector search using Cosine Distance (<=>)
          // PostgreSQL pgvector operator: <=>
          // Returns distance (0 is identical, 2 is opposite). Lower is better.
          try {
            const rawCandidates: any[] = await prisma.$queryRaw`
              SELECT id, product_code, name, price, description, image_url,
                     1 - (embedding <=> ${vectorStr}::vector) as similarity
              FROM products
              ORDER BY embedding <=> ${vectorStr}::vector
              LIMIT 5
            `;
            
            // Filter out items already found in text search
            const existingIds = new Set(candidates.map(c => c.id));
            
            const vectorCandidates = rawCandidates
              .filter(c => !existingIds.has(c.id))
              .map(c => ({
                id: c.id,
                productCode: c.product_code,
                name: c.name,
                price: Number(c.price),
                description: c.description,
                imageUrl: c.image_url,
                similarity: Number(c.similarity)
              }));
              
            candidates = [...candidates, ...vectorCandidates];
          } catch (e) {
            console.error("Vector search error:", e);
          }
        }
      }

      return {
        original: item,
        candidates: candidates
      };
    }));

    return NextResponse.json({ results });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
