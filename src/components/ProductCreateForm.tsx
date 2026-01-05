'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Category = {
  id: number;
  name: string;
};

type Props = {
  categories: Category[];
};

export default function ProductCreateForm({ categories }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    // productCode: '', // 自動生成のため削除
    price: '',
    description: '',
    categoryId: '',
    newCategoryName: '',
    imageUrl: '',
    weightKg: '',
    dimensions: '',
  });

  const [isNewCategory, setIsNewCategory] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 価格の数値変換チェック
      const price = parseFloat(formData.price);
      if (isNaN(price)) {
        throw new Error('価格には数値を入力してください');
      }

      const payload = {
        ...formData,
        price,
        categoryId: isNewCategory ? null : (formData.categoryId || null),
        newCategoryName: isNewCategory ? formData.newCategoryName : null,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '登録に失敗しました');
      }

      setSuccess(`商品を登録しました！(コード: ${data.productCode}) 商品一覧へ移動します...`);
      
      // フォームリセット
      setFormData({
        name: '',
        price: '',
        description: '',
        categoryId: '',
        newCategoryName: '',
        imageUrl: '',
        weightKg: '',
        dimensions: '',
      });
      setIsNewCategory(false);

      // 少し待ってから一覧へ遷移
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 商品名 */}
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            商品名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: ボンディング材"
          />
        </div>

        {/* 商品コード (自動生成のため非表示、あるいは説明のみ表示) */}
        {/* 
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            商品コード
          </label>
          <input
            type="text"
            disabled
            className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500"
            value="自動生成されます"
          />
        </div>
        */}

        {/* 価格 */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            価格 (円) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="price"
            name="price"
            required
            min="0"
            value={formData.price}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 1500"
          />
        </div>

        {/* カテゴリ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリ
          </label>
          
          {!isNewCategory ? (
            <div className="flex gap-2">
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsNewCategory(true)}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50"
              >
                新規作成
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                name="newCategoryName"
                value={formData.newCategoryName}
                onChange={handleChange}
                placeholder="新しいカテゴリ名"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setIsNewCategory(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                選択に戻る
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 border border-blue-100">
        <p>ℹ️ 商品コードは登録時に自動的に採番されます（現在の最大値 + 1）。</p>
      </div>

      {/* 説明 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          商品説明
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="商品の詳細な説明を入力してください"
        />
        <p className="text-xs text-gray-500 mt-1">
          ※この説明文はAI検索（ベクトル検索）に使用されます。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* 画像URL */}
         <div className="md:col-span-3">
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
            画像URL (任意)
          </label>
          <input
            type="text"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* 重量 */}
        <div>
          <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700 mb-1">
            重量 (kg)
          </label>
          <input
            type="number"
            id="weightKg"
            name="weightKg"
            step="0.01"
            value={formData.weightKg}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 寸法 */}
        <div className="md:col-span-2">
          <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700 mb-1">
            寸法
          </label>
          <input
            type="text"
            id="dimensions"
            name="dimensions"
            value={formData.dimensions}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 10x20x5 cm"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? '登録中...' : '商品を登録する'}
        </button>
      </div>
    </form>
  );
}
