'use client';

import Link from 'next/link';
import { Check, Heart, Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { discountPercent, formatPrice, Product } from '../data/products';
import { useCart } from '../context/cart-context';
import { useWishlist } from '../context/wishlist-context';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);

  const wishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, product.sizes[0] || 'Free size', 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="product-card group min-w-0">
      <div className="relative aspect-[.82] overflow-hidden rounded-2xl" style={{ backgroundColor: product.tone }}>
        <Link href={`/products/${encodeURIComponent(product.id)}`} className="absolute inset-0 block">
          <img src={product.image} alt={product.name} className="product-image h-full w-full object-cover" />
          {product.badge && (
            <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#4f6bff]">
              {product.badge}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors ${
            wishlisted ? 'text-[#d600c7]' : 'text-[#696663] hover:text-[#d600c7]'
          }`}
        >
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/products/${encodeURIComponent(product.id)}`}
              className="block truncate text-[13px] font-bold text-[#171717] transition-colors hover:text-[#4f6bff]"
            >
              {product.name}
            </Link>
            <p className="mt-1 truncate text-[10px] text-[#77736f]">{product.description}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded bg-[#eef8ed] px-1.5 py-1 text-[10px] font-bold text-[#287335]">
            <Star size={10} fill="currentColor" /> {product.rating || '4.8'}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[14px] font-extrabold">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <>
              <del className="text-[10px] text-[#96918c]">{formatPrice(product.originalPrice)}</del>
              <span className="text-[10px] font-bold text-[#d600c7]">{discountPercent(product)}% off</span>
            </>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span
            className={`text-[9px] font-semibold ${
              product.stock.toLowerCase().includes('only') || product.stock.toLowerCase().includes('low')
                ? 'text-[#d66a00]'
                : 'text-[#55805b]'
            }`}
          >
            {product.stock || 'In stock'}
          </span>
          <span className="text-[9px] text-[#96918c]">{product.reviews || 12} reviews</span>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          className={`mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-[10px] font-bold transition-all ${
            added
              ? 'bg-[#287335] text-white'
              : 'border border-[#4f6bff] bg-white text-[#4f6bff] hover:bg-[#4f6bff] hover:text-white'
          }`}
        >
          {added ? (
            <>
              <Check size={14} /> Added to bag
            </>
          ) : (
            <>
              <Plus size={14} /> Add to bag
            </>
          )}
        </button>
      </div>
    </article>
  );
}