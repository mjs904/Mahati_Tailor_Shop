'use client';

import Link from 'next/link';
import { Heart, Plus, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { discountPercent, formatPrice, Product } from '../data/products';

export default function ProductCard({ product }: { product: Product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(window.localStorage.getItem('mahathi-wishlist') || '[]') as string[];
    setWishlisted(saved.includes(product.id));
  }, [product.id]);

  const toggleWishlist = () => {
    const saved = JSON.parse(window.localStorage.getItem('mahathi-wishlist') || '[]') as string[];
    const next = saved.includes(product.id) ? saved.filter((id) => id !== product.id) : [...saved, product.id];
    window.localStorage.setItem('mahathi-wishlist', JSON.stringify(next));
    window.localStorage.setItem('mahathi-wishlist-count', String(next.length));
    window.dispatchEvent(new Event('mahathi-wishlist-updated'));
    setWishlisted(next.includes(product.id));
  };

  const addToCart = () => {
    const next = Number(window.sessionStorage.getItem('mahathi-cart-count') || 0) + 1;
    window.sessionStorage.setItem('mahathi-cart-count', String(next));
    window.dispatchEvent(new Event('mahathi-cart-updated'));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="product-card group min-w-0">
      <div className="relative aspect-[.82] overflow-hidden rounded-2xl" style={{ backgroundColor: product.tone }}>
        <Link href={`/products/${encodeURIComponent(product.id)}`} className="absolute inset-0 block">
          <img src={product.image} alt={product.name} className="product-image h-full w-full object-cover" />
          {product.badge && <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#4f6bff]">{product.badge}</span>}
        </Link>
        <button type="button" onClick={toggleWishlist} aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 transition-colors ${wishlisted ? 'text-[#d600c7]' : 'text-[#696663] hover:text-[#d600c7]'}`}><Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><Link href={`/products/${encodeURIComponent(product.id)}`} className="block truncate text-[13px] font-bold text-[#171717] hover:text-[#4f6bff]">{product.name}</Link><p className="mt-1 truncate text-[10px] text-[#77736f]">{product.description}</p></div>
          <span className="flex shrink-0 items-center gap-1 rounded bg-[#eef8ed] px-1.5 py-1 text-[10px] font-bold text-[#287335]"><Star size={10} fill="currentColor" /> {product.rating}</span>
        </div>
        <div className="mt-2 flex items-center gap-2"><span className="text-[14px] font-extrabold">{formatPrice(product.price)}</span>{product.originalPrice && <><del className="text-[10px] text-[#96918c]">{formatPrice(product.originalPrice)}</del><span className="text-[10px] font-bold text-[#d600c7]">{discountPercent(product)}% off</span></>}</div>
        <div className="mt-1.5 flex items-center justify-between gap-2"><span className={`text-[9px] font-semibold ${product.stock.includes('Only') ? 'text-[#d66a00]' : 'text-[#55805b]'}`}>{product.stock}</span><span className="text-[9px] text-[#96918c]">{product.reviews} reviews</span></div>
        <button type="button" onClick={addToCart} className={`mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-[10px] font-bold transition-colors ${added ? 'bg-[#287335] text-white' : 'border border-[#4f6bff] bg-white text-[#4f6bff] hover:bg-[#4f6bff] hover:text-white'}`}><Plus size={14} /> {added ? 'Added to cart' : 'Add to cart'}</button>
      </div>
    </article>
  );
}