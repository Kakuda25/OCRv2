'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { OCRModal } from '@/components/OCRModal';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductImage } from '@/components/ProductImage';
import { Product, Category } from '@prisma/client';

type ProductWithCategory = Product & { category: Category | null };

interface ProductDashboardProps {
  initialCategories: Category[];
}

export function ProductDashboard({ initialCategories }: ProductDashboardProps) {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Initial load check to prevent double fetch or race conditions
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    // Skip first render to avoid clearing products unnecessarily if we want to preserve initial state
    // But here we want to debounce the search input
    const timer = setTimeout(() => {
        if (search !== debouncedSearch) {
            setDebouncedSearch(search);
            setPage(1);
            setProducts([]); 
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  // Reset page when category changes
  useEffect(() => {
    setPage(1);
    setProducts([]);
  }, [categoryId]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLTableRowElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchProducts = async (currentPage: number, currentSearch: string, currentCategory: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      if (currentSearch) params.set('q', currentSearch);
      if (currentCategory) params.set('category', currentCategory);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
      const data = await res.json();
      
      if (!mounted.current) return;

      setProducts(prev => {
        if (currentPage === 1) return data.products;
        // 重複除外
        const newProducts = data.products.filter((p: ProductWithCategory) => 
            !prev.some(existing => existing.id === p.id)
        );
        return [...prev, ...newProducts];
      });
      setHasMore(currentPage < data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
      if (mounted.current) {
        setError("商品の読み込みに失敗しました。");
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Only fetch if we are not already loading or if it's a new search/filter (page=1)
    // Actually, simple dependency on page/debouncedSearch/categoryId is enough
    fetchProducts(page, debouncedSearch, categoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, categoryId]);

  return (
    <div>
      {/* Sticky Operation Area */}
      <div className="sticky top-16 z-30 -mx-4 sm:-mx-8 px-4 sm:px-8 py-4 bg-gray-50/95 backdrop-blur border-b border-gray-200 shadow-sm mb-8 transition-all">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
             <OCRModal trigger={
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-bold whitespace-nowrap active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    OCRで発注
                </button>
             } />
             
             <div className="relative flex-1 w-full group">
               <input 
                 type="text" 
                 placeholder="商品名・コード・説明で検索..." 
                 className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all group-hover:border-blue-300"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
               <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
             </div>

             <select 
               className="py-2.5 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm w-full sm:w-auto cursor-pointer hover:border-blue-300 transition-colors"
               value={categoryId}
               onChange={(e) => setCategoryId(e.target.value)}
             >
               <option value="">全カテゴリ</option>
               {initialCategories.map(cat => (
                 <option key={cat.id} value={cat.id}>{cat.name}</option>
               ))}
             </select>
          </div>
        </div>
      </div>

      {/* Product List */}
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
              {products.map((product, index) => (
                <tr 
                    key={`${product.id}-${index}`} 
                    ref={index === products.length - 1 ? lastElementRef : null} 
                    className="hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100 overflow-hidden">
                        <ProductImage src={product.imageUrl} alt={product.name} />
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
        
        {products.length === 0 && !loading && !error && (
          <div className="text-center py-20">
            <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">商品が見つかりません</h3>
            <p className="mt-1 text-gray-500">条件を変更して再度検索してください。</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <div className="bg-red-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">エラーが発生しました</h3>
            <p className="mt-1 text-gray-500">{error}</p>
            <button 
                onClick={() => fetchProducts(1, debouncedSearch, categoryId)}
                className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
                再読み込み
            </button>
          </div>
        )}

        {loading && (
            <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-2 text-sm">読み込み中...</p>
            </div>
        )}
      </div>
    </div>
  );
}

