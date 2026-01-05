import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getEmbedding } from '@/lib/gemini';
import { TaskType } from '@google/generative-ai';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q');
    const categoryId = searchParams.get('category');

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          id: 'asc',
        },
        take: limit,
        skip: skip,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { 
      name, 
      productCode, // 任意入力、なければ自動生成
      price, 
      description, 
      categoryId, 
      newCategoryName, 
      imageUrl, 
      weightKg, 
      dimensions 
    } = body;

    // バリデーション
    if (!name || !price) {
      return NextResponse.json(
        { error: '必須項目が不足しています (name, price)' }, 
        { status: 400 }
      );
    }

    // 商品コードの自動生成
    if (!productCode) {
      // 数値のみで構成されるproduct_codeの最大値を取得
      const result = await prisma.$queryRaw<{ max_code: number }[]>`
        SELECT MAX(CAST(product_code AS INTEGER)) as max_code 
        FROM products 
        WHERE product_code ~ '^[0-9]+$'
      `;
      
      const maxCode = result[0]?.max_code || 0;
      productCode = (maxCode + 1).toString();
    } else {
      // 指定された場合は重複チェック
      const existingProduct = await prisma.product.findUnique({
        where: { productCode },
      });
      if (existingProduct) {
        return NextResponse.json(
          { error: 'この商品コードは既に使用されています' }, 
          { status: 409 }
        );
      }
    }

    // カテゴリ処理
    let finalCategoryId: number | null = categoryId ? parseInt(categoryId) : null;

    if (!finalCategoryId && newCategoryName) {
      // 新規カテゴリ作成または既存検索
      const category = await prisma.category.upsert({
        where: { name: newCategoryName },
        update: {},
        create: { name: newCategoryName },
      });
      finalCategoryId = category.id;
    }

    // Embedding生成 (商品名 + 説明)
    // Pythonスクリプトに形式を合わせる: f"Product Name: {name}\nDescription: {description}"
    // かつ TaskType.RETRIEVAL_DOCUMENT を指定
    const textToEmbed = `Product Name: ${name}\nDescription: ${description || ''}`;
    const embedding = await getEmbedding(textToEmbed, TaskType.RETRIEVAL_DOCUMENT);

    // 商品作成
    const product = await prisma.$transaction(async (tx) => {
      // 1. 商品レコード作成
      const p = await tx.product.create({
        data: {
          name,
          productCode,
          price: new Prisma.Decimal(price),
          description,
          categoryId: finalCategoryId,
          imageUrl,
          weightKg: weightKg ? new Prisma.Decimal(weightKg) : null,
          dimensions,
          status: 'active',
        },
      });

      // 2. Embedding更新 (もし生成できていれば)
      if (embedding) {
        const vectorString = `[${embedding.join(',')}]`;
        await tx.$executeRaw`
          UPDATE products
          SET embedding = ${vectorString}::vector
          WHERE id = ${p.id}
        `;
      }

      return p;
    });

    return NextResponse.json(product, { status: 201 });

  } catch (error) {
    console.error('Create Product Error:', error);
    return NextResponse.json(
      { error: '商品の登録に失敗しました' }, 
      { status: 500 }
    );
  }
}
