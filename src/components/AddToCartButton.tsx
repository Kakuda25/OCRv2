'use client';

import { useCartStore, CartProduct } from '@/lib/store';
import { useState } from 'react';

interface AddToCartButtonProps {
  product: CartProduct;
}

export const AddToCartButton = ({ product }: AddToCartButtonProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1000);
  };

  return (
    <button
      onClick={handleAdd}
      className={`px-4 py-1.5 rounded-md transition-all text-xs font-bold border ${
        isAdded
          ? 'bg-green-600 border-green-600 text-white'
          : 'text-blue-600 hover:text-white border-blue-600 hover:bg-blue-600'
      }`}
    >
      {isAdded ? '追加済み' : 'カートへ'}
    </button>
  );
};

