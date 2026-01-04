'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCartStore } from '@/lib/store';
import { ProductImage } from './ProductImage';

interface OCRResult {
  original: {
    name: string;
    code?: string;
    // quantity removed
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

interface OCRModalProps {
  trigger?: React.ReactNode;
}

// Helper Component for Candidate Card
const CandidateCard = ({ 
    candidate, 
    idx, 
    selectedItems, 
    handleCandidateSelect,
    type
}: { 
    candidate: any, 
    idx: number, 
    selectedItems: Record<number, number[]>, 
    handleCandidateSelect: (idx: number, id: number) => void,
    type: 'candidate' | 'recommendation'
}) => {
    const isSelected = selectedItems[idx]?.includes(candidate.id);
    const isRecommendation = type === 'recommendation';
    
    // Style adjustments based on type
    const activeBorderColor = isRecommendation ? 'border-orange-500' : 'border-blue-500';
    const activeBgColor = isRecommendation ? 'bg-orange-50/50' : 'bg-blue-50/50';
    const activeRingColor = isRecommendation ? 'ring-orange-500/20' : 'ring-blue-500/20';
    const activeTextColor = isRecommendation ? 'text-orange-900' : 'text-blue-900';
    const inputColor = isRecommendation ? 'text-orange-600 focus:ring-orange-500' : 'text-blue-600 focus:ring-blue-500';

    return (
        <label 
            className={`relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
            isSelected 
                ? `${activeBorderColor} ${activeBgColor} ring-1 ${activeRingColor}` 
                : 'border-transparent bg-gray-50 hover:bg-white hover:border-gray-200'
            }`}
        >
            <div className="flex items-center h-full pt-1">
                <input 
                    type="checkbox" 
                    name={`product-${idx}`} 
                    className={`w-4 h-4 rounded border-gray-300 ${inputColor}`}
                    checked={isSelected}
                    onChange={() => handleCandidateSelect(idx, candidate.id)}
                />
            </div>
            
            <div className="h-12 w-12 rounded-lg overflow-hidden bg-white shrink-0 border border-gray-100">
                <ProductImage src={candidate.imageUrl} alt={candidate.name} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <h4 className={`font-bold text-sm ${isSelected ? activeTextColor : 'text-gray-900'}`}>
                        {candidate.name}
                    </h4>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full whitespace-nowrap ${
                        candidate.similarity > 0.8 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {Math.round(candidate.similarity * 100)}%
                    </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{candidate.description}</p>
                <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-sm font-bold text-gray-900">¥{Number(candidate.price).toLocaleString()}</span>
                    <span className="text-xs text-gray-400 font-mono">{candidate.productCode}</span>
                </div>
            </div>
        </label>
    );
};

export function OCRModal({ trigger }: OCRModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<OCRResult[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<number, number[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      } else {
        alert('商品の読み取りに失敗しました');
      }
    } catch (error) {
      console.error(error);
      alert('OCR処理に失敗しました');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCandidateSelect = (resultIndex: number, candidateId: number) => {
    setSelectedItems(prev => {
        const currentSelections = prev[resultIndex] || [];
        if (currentSelections.includes(candidateId)) {
            // Deselect
            return {
                ...prev,
                [resultIndex]: currentSelections.filter(id => id !== candidateId)
            };
        } else {
            // Select (Multi-select)
            return {
                ...prev,
                [resultIndex]: [...currentSelections, candidateId]
            };
        }
    });
  };

  const handleAddToCart = () => {
    let addedCount = 0;
    
    results.forEach((result, index) => {
      const selectedIds = selectedItems[index] || [];
      selectedIds.forEach(selectedId => {
        const candidate = result.candidates.find(c => c.id === selectedId);
        if (candidate) {
          addItem({
            id: candidate.id,
            name: candidate.name,
            price: candidate.price,
            productCode: candidate.productCode,
            imageUrl: candidate.imageUrl
          }, 1);
          addedCount++;
        }
      });
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

  const triggerButton = trigger ? (
    <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">{trigger}</div>
  ) : (
    <button 
      onClick={() => setIsOpen(true)}
      className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
      <span className="font-bold">OCR注文</span>
    </button>
  );

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <header className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">発注書読取結果</h2>
            <p className="text-xs text-gray-500">写真をアップロードして商品を検索します</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {!results.length && !isLoading && (
            <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all bg-white group cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className="mb-4 text-gray-400 group-hover:text-blue-500 transition-colors">
                <svg className="mx-auto h-16 w-16" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <button 
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-shadow shadow-sm mb-2"
              >
                画像を選択
              </button>
              <p className="text-sm text-gray-500">ドラッグ＆ドロップ、またはタップして撮影</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mt-6">画像を解析しています</h3>
              <p className="text-sm text-gray-500 mt-2">商品名と数量を読み取っています...</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-6">
              {results.map((result, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">読み取り結果</span>
                      <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                         {result.original.name}
                      </div>
                    </div>
                    {/* Quantity display removed */}
                  </div>

                  <div className="p-4 space-y-3">
                    {(() => {
                        const directCandidates = result.candidates.filter(c => c.similarity >= 0.8);
                        const recommendedCandidates = result.candidates.filter(c => c.similarity < 0.8);
                        
                        return (
                            <div className="space-y-4">
                                {/* 1. Direct Candidates (High Similarity) */}
                                <div>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide px-1 mb-2">候補</p>
                                    {directCandidates.length > 0 ? (
                                        <div className="grid gap-3">
                                            {directCandidates.map(candidate => (
                                                <CandidateCard 
                                                    key={candidate.id} 
                                                    candidate={candidate} 
                                                    idx={idx} 
                                                    selectedItems={selectedItems} 
                                                    handleCandidateSelect={handleCandidateSelect}
                                                    type="candidate"
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 px-1">一致する候補は見つかりませんでした</p>
                                    )}
                                </div>

                                {/* 2. Recommended Candidates (Lower Similarity) */}
                                {recommendedCandidates.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-orange-500 uppercase tracking-wide px-1 mb-2 mt-2">おすすめ</p>
                                        <div className="grid gap-3">
                                            {recommendedCandidates.map(candidate => (
                                                <CandidateCard 
                                                    key={candidate.id} 
                                                    candidate={candidate} 
                                                    idx={idx} 
                                                    selectedItems={selectedItems} 
                                                    handleCandidateSelect={handleCandidateSelect}
                                                    type="recommendation"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {result.candidates.length === 0 && (
                                    <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <p className="text-gray-500 text-sm">候補が見つかりませんでした。</p>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                  </div>
                </div>
              ))}
              
              <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200 p-4 -mx-6 -mb-6 flex justify-end gap-3 mt-4">
                <button 
                  onClick={() => { setResults([]); setIsLoading(false); setSelectedItems({}); }}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-bold text-sm transition-colors"
                >
                  やり直す
                </button>
                <button 
                  onClick={handleAddToCart}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2"
                >
                  <span>確定してカートへ</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  if (!mounted) return triggerButton;

  return (
    <>
      {triggerButton}
      {createPortal(modalContent, document.body)}
    </>
  );
}
