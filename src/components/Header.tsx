import Link from 'next/link';
import { CartIcon } from './CartIcon';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* 左側: ロゴ */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
          </div>
          <span className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            OCR発注システム
          </span>
        </Link>

        {/* 右側: ナビゲーション & カート */}
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/orders" className="hidden md:block hover:text-blue-600 transition-colors">
              発注済み一覧
            </Link>
            <Link href="/products/new" className="hidden md:block hover:text-blue-600 transition-colors">
              商品登録
            </Link>
          </nav>
          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
          <CartIcon />
        </div>
      </div>
    </header>
  );
};

