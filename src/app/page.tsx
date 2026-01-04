import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { OCRModal } from '@/components/OCRModal';
import { AddToCartButton } from '@/components/AddToCartButton';
import { CartIcon } from '@/components/CartIcon';
import { Prisma } from '@prisma/client';

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true }
}>;

export default async function Home() {
  let products: ProductWithCategory[] = [];
  try {
    products = await prisma.product.findMany({
      take: 50,
      orderBy: { id: 'asc' },
      include: { category: true }
    });
  } catch (e) {
    console.error("Database Error:", e);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">発注管理システム</h1>
          <p className="text-sm text-gray-500 mt-1">商品一覧</p>
        </div>
        <div className="flex items-center gap-4">
          <CartIcon />
          <OCRModal />
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">商品名 / 説明</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">コード</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">カテゴリ</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">単価</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
                        {/* Placeholder icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{product.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description || '説明なし'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      {product.productCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {product.category?.name || '未分類'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-gray-900">¥{Number(product.price).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <AddToCartButton product={{
                      id: product.id,
                      name: product.name,
                      price: Number(product.price),
                      productCode: product.productCode,
                      imageUrl: product.imageUrl
                    }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">商品が見つかりません</h3>
            <p className="mt-1 text-gray-500">データベースに商品が登録されていないようです。</p>
          </div>
        )}
      </div>
    </div>
  );
}
