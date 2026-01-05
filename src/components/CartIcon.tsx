'use client';

import { useCartStore } from '@/lib/store';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export const CartIcon = () => {
  const totalItems = useCartStore((state) => state.totalItems());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch by rendering a placeholder or default state
    return (
        <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <span>カート</span>
      </Link>
    );
  }

  return (
    <Link href="/cart" className="relative flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <span>カート</span>
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
          {totalItems}
        </span>
      )}
    </Link>
  );
};



