import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface OrderItemRequest {
  productId: number;
  quantity: number;
}

interface OrderRequest {
  items: OrderItemRequest[];
}

export async function GET() {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: {
            lineIndex: 'asc',
          },
        },
      },
    });

    // BigIntのシリアライズ対応
    const serializedOrders = orders.map((order) => ({
      ...order,
      id: order.id.toString(),
      items: order.items.map((item) => ({
        ...item,
        id: item.id.toString(),
        purchaseOrderId: item.purchaseOrderId.toString(),
        product: {
          ...item.product,
          price: item.product.price.toString(),
        },
      })),
    }));

    return NextResponse.json(serializedOrders);
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    return NextResponse.json(
      { error: '発注履歴の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: OrderRequest = await req.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: '注文アイテムがありません' },
        { status: 400 }
      );
    }

    // トランザクションで注文作成とアイテム作成を行う
    const order = await prisma.$transaction(async (tx) => {
      // 1. PurchaseOrderを作成
      const newOrder = await tx.purchaseOrder.create({
        data: {},
      });

      // 2. PurchaseOrderItemを作成
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId: newOrder.id,
            lineIndex: i + 1,
            productId: item.productId,
            quantity: item.quantity,
          },
        });
      }

      return newOrder;
    });

    return NextResponse.json(
      { message: '発注が完了しました', orderId: order.id.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order Error:', error);
    return NextResponse.json(
      { error: '発注処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
