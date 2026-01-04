'use client';

import { useState, useRef } from 'react';
import { useCartStore } from '@/lib/store';

interface OCRResult {
  original: {
    name: string;
    code?: string;
    quantity: number;
  };
  candidates: {
    id: number;
    productCode: string;
    name: string;
    price: number;
    description: string;
    imageUrl?: string | null;
    similarity: number;
  }[];
}

export function OCRModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<OCRResult[]>([]);
  // Store selected candidate ID for each result index
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addItem = useCartStore((state) => state.addItem);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setResults([]);
    setSelectedItems({});

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.results) {
        setResults(data.results);
        
        // Auto-select the first candidate for each result if available
        const initialSelections: Record<number, number> = {};
        data.results.forEach((result: OCRResult, index: number) => {
          if (result.candidates && result.candidates.length > 0) {
            initialSelections[index] = result.candidates[0].id;
          }
        });
        setSelectedItems(initialSelections);
      } else {
        alert('商品の読み取りに失敗しました');
      }
    } catch (error) {
      console.error(error);
      alert('OCR処理に失敗しました');
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCandidateSelect = (resultIndex: number, candidateId: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [resultIndex]: candidateId
    }));
  };

  const handleAddToCart = () => {
    let addedCount = 0;
    
    results.forEach((result, index) => {
      const selectedId = selectedItems[index];
      if (selectedId) {
        const candidate = result.candidates.find(c => c.id === selectedId);
        if (candidate) {
          addItem({
            id: candidate.id,
            name: candidate.name,
            price: candidate.price,
            productCode: candidate.productCode,
            imageUrl: candidate.imageUrl
          }, result.original.quantity);
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      alert(`${addedCount}件の商品をカートに追加しました`);
      setIsOpen(false);
      setResults([]);
      setSelectedItems({});
    } else {
      alert('追加する商品が選択されていません');
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span className="font-bold">OCR注文</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <header className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">発注書読取</h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200">
            ✕
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-1">
          {!results.length && !isLoading && (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-gray-50">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className="mb-4 text-gray-400">
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                画像を選択または撮影
              </button>
              <p className="mt-2 text-sm text-gray-500">発注書の写真をアップロードしてください</p>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-20">
              <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
              <p className="text-lg font-medium text-gray-800">画像を解析中...</p>
              <p className="text-sm text-gray-500 mt-2">AIが商品名と数量を読み取っています</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-8">
              {results.map((result, idx) => (
                <div key={idx} className="border rounded-xl p-5 bg-white shadow-sm">
                  <div className="mb-4 pb-3 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">読取結果</span>
                         <h3 className="text-xl font-bold text-gray-800 mt-1">{result.original.name}</h3>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-full text-sm">
                        数量: {result.original.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">AI推奨候補</p>
                    {result.candidates.length > 0 ? (
                      result.candidates.map(candidate => (
                        <label 
                          key={candidate.id} 
                          className={`flex items-start gap-4 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedItems[idx] === candidate.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-transparent hover:border-blue-100 hover:bg-blue-50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name={`product-${idx}`} 
                            className="mt-1"
                            checked={selectedItems[idx] === candidate.id}
                            onChange={() => handleCandidateSelect(idx, candidate.id)}
                          />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-bold text-sm text-gray-800">{candidate.name}</h4>
                              <span className="text-xs text-green-600 font-mono bg-green-50 px-2 py-0.5 rounded">
                                {Math.round(candidate.similarity * 100)}% 一致
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1">{candidate.description}</p>
                            <p className="font-bold text-sm text-gray-900 mt-1">¥{Number(candidate.price).toLocaleString()}</p>
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded">候補が見つかりませんでした。商品名を手動で検索してください。</p>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="pt-6 flex justify-end gap-3 border-t">
                <button 
                  onClick={() => { setResults([]); setIsLoading(false); setSelectedItems({}); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  やり直す
                </button>
                <button 
                  onClick={handleAddToCart}
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md hover:shadow-lg transition-all"
                >
                  選択した商品をカートに追加
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
