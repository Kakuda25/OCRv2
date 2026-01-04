'use client';

import { useState, useEffect } from 'react';

export const ProductImage = ({ src, alt, className }: { src?: string | null, alt: string, className?: string }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (src && !error) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img 
        src={src} 
        alt={alt} 
        className={`object-cover w-full h-full ${className}`}
        onError={() => setError(true)}
      />
    );
  }

  // Generate a consistent color based on the product name for visual variety
  // More subtle/neutral background for "image placeholder" feel
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  
  const colors = [
    'bg-gray-100 text-gray-400',
    'bg-slate-100 text-slate-400',
    'bg-zinc-100 text-zinc-400',
    'bg-stone-100 text-stone-400',
  ];
  
  const colorIndex = Math.abs(getHash(alt)) % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <div className={`flex items-center justify-center w-full h-full ${colorClass} ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="50%" height="50%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    </div>
  );
};
