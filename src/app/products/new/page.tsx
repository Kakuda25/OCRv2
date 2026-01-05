import { prisma } from '@/lib/prisma';
import ProductCreateForm from '@/components/ProductCreateForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">商品登録</h1>
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border">
        <ProductCreateForm categories={categories} />
      </div>
    </div>
  );
}
