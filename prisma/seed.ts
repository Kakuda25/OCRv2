import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// @ts-ignore
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL_NAME = "models/text-embedding-004";

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (e) {
    console.error(`Error generating embedding: ${e}`);
    return null;
  }
}

async function main() {
  console.log('Starting seed...');

  // 1. SQLファイルの実行 (データが空の場合のみ)
  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    console.log('Seeding initial data from SQL files...');
    
    // 04-seed-data.sqlにはINSERT文が含まれている
    const sqlFiles = ['db/04-seed-data.sql', 'db/05-purchase-orders.sql'];
    
    for (const file of sqlFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            console.log(`Executing ${file}...`);
            const sql = fs.readFileSync(filePath, 'utf-8');
            try {
                // SQLファイルをそのまま実行
                await prisma.$executeRawUnsafe(sql);
                console.log(`Executed ${file}`);
            } catch (e) {
                console.error(`Error executing ${file}:`, e);
            }
        } else {
            console.warn(`File not found: ${file}`);
        }
    }
  } else {
    console.log('Data already exists, skipping SQL seed.');
  }

  // 2. Embedding生成と更新
  console.log('Checking for products without embeddings...');
  
  // Embeddingが未設定の商品を取得
  const productsWithoutEmbedding = await prisma.$queryRaw<Array<{ id: number, name: string, description: string | null }>>`
    SELECT id, name, description FROM products WHERE embedding IS NULL
  `;

  if (productsWithoutEmbedding.length > 0) {
    console.log(`Found ${productsWithoutEmbedding.length} products without embeddings. Generating...`);
    
    let count = 0;
    for (const product of productsWithoutEmbedding) {
      const text = `Product Name: ${product.name}\nDescription: ${product.description || ''}`;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const embedding = await getEmbedding(text);
      
      if (embedding) {
        // vector型への更新
        const vectorStr = `[${embedding.join(',')}]`;
        
        await prisma.$executeRaw`
          UPDATE products 
          SET embedding = ${vectorStr}::vector
          WHERE id = ${product.id}
        `;
        count++;
        if (count % 10 === 0) process.stdout.write('.');
      } else {
          console.warn(`Failed to generate embedding for product ${product.id}`);
      }
    }
    console.log(`\nUpdated embeddings for ${count} products.`);
  } else {
    console.log('All products have embeddings.');
  }
  
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

