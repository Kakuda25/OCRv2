'use client';

import { useEffect, useState } from 'react';
import { ProductImage } from '@/components/ProductImage';

type Product = {
  id: number;
  name: string;
  productCode: string;
  price: string;
  imageUrl: string | null;
};

type OrderItem = {
  id: string;
  productId: number;
  quantity: string;
  product: Product;
};

type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error('発注履歴の取得に失敗しました');
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError('データの読み込み中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">エラー: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 sm:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">発注履歴</h1>
          <p className="text-gray-500 mt-2">過去の発注内容を確認できます</p>
        </header>

        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <p className="text-gray-500 text-lg">発注履歴はありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-gray-900">
                      発注番号: #{order.id}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {new Date(order.createdAt).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    合計 {order.items.length} 点
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                      <div className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                        <ProductImage 
                          src={item.product.imageUrl} 
                          alt={item.product.name} 
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              コード: {item.product.productCode}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              {Number(item.quantity).toLocaleString()} 個
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
