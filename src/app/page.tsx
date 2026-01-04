import { prisma } from '@/lib/prisma';
import { ProductDashboard } from '@/components/ProductDashboard';

export default async function Home() {
  let categories = [];
  try {
    categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
    });
  } catch (e) {
    console.error("Database Error:", e);
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
       <div className="container mx-auto px-4 sm:px-8 py-8">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">商品一覧</h1>
            <p className="text-gray-500 mt-2">発注したい商品を検索またはOCRで読み込んでください</p>
        </header>
        
        <ProductDashboard initialCategories={categories} />
      </div>
    </div>
  );
}
