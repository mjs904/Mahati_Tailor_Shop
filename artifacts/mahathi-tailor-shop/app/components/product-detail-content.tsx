'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Heart,
  LoaderCircle,
  Plus,
  Star,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  discountPercent,
  fetchProductById,
  formatPrice,
  Product,
} from '../data/products';
import { getInsforgeErrorMessage } from '../../lib/insforge';

export default function ProductDetailContent() {
  const params = useParams<{ id: string }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchProductById(decodeURIComponent(productId));
        if (!mounted) {
          return;
        }
        setProduct(result.product);
        setError(result.error);
      } catch (loadError) {
        if (mounted) {
          setError(loadError);
          setProduct(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadProduct();
    return () => {
      mounted = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!product) {
      return;
    }
    const saved = JSON.parse(
      window.localStorage.getItem('mahathi-wishlist') || '[]',
    ) as string[];
    setWishlisted(saved.includes(product.id));
  }, [product]);

  const toggleWishlist = () => {
    if (!product) {
      return;
    }
    const saved = JSON.parse(
      window.localStorage.getItem('mahathi-wishlist') || '[]',
    ) as string[];
    const next = saved.includes(product.id)
      ? saved.filter((id) => id !== product.id)
      : [...saved, product.id];
    window.localStorage.setItem('mahathi-wishlist', JSON.stringify(next));
    window.localStorage.setItem('mahathi-wishlist-count', String(next.length));
    window.dispatchEvent(new Event('mahathi-wishlist-updated'));
    setWishlisted(next.includes(product.id));
  };

  const addToCart = () => {
    const next =
      Number(window.sessionStorage.getItem('mahathi-cart-count') || 0) + 1;
    window.sessionStorage.setItem('mahathi-cart-count', String(next));
    window.dispatchEvent(new Event('mahathi-cart-updated'));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <main className="market-shell min-h-[100dvh]">
      <div className="market-container pb-20 pt-7">
        <Link
          href="/shop"
          className="mb-6 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4f6bff]"
        >
          <ArrowLeft size={14} /> Back to shop
        </Link>

        {loading ? (
          <div className="flex min-h-[560px] items-center justify-center">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#696663]">
              <LoaderCircle size={17} className="animate-spin text-[#4f6bff]" />
              Loading product…
            </div>
          </div>
        ) : error ? (
          <StatePanel
            title="This product could not be loaded"
            message={getInsforgeErrorMessage(
              error,
              'We could not load this product right now. Please try again.',
            )}
          />
        ) : !product ? (
          <StatePanel
            title="Product not found"
            message="This piece may have been removed or is no longer available."
          />
        ) : (
          <article className="grid gap-8 rounded-2xl bg-white p-5 shadow-[0_14px_40px_rgba(23,23,23,.06)] md:grid-cols-[.95fr_1.05fr] md:p-8">
            <div
              className="relative aspect-[.9] overflow-hidden rounded-2xl"
              style={{ backgroundColor: product.tone }}
            >
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {product.badge && (
                <span className="absolute left-4 top-4 rounded-md bg-white/90 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#4f6bff]">
                  {product.badge}
                </span>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <p className="font-label text-[9px] uppercase tracking-[.18em] text-[#d600c7]">
                {product.category}
              </p>
              <div className="mt-2 flex items-start justify-between gap-4">
                <h1 className="text-3xl font-extrabold leading-[1.05] tracking-[-.06em]">
                  {product.name}
                </h1>
                <button
                  type="button"
                  onClick={toggleWishlist}
                  aria-label={
                    wishlisted
                      ? `Remove ${product.name} from wishlist`
                      : `Add ${product.name} to wishlist`
                  }
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ddd8d1] transition-colors ${
                    wishlisted
                      ? 'text-[#d600c7]'
                      : 'text-[#696663] hover:text-[#d600c7]'
                  }`}
                >
                  <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="flex items-center gap-1 rounded bg-[#eef8ed] px-1.5 py-1 text-[10px] font-bold text-[#287335]">
                  <Star size={10} fill="currentColor" /> {product.rating}
                </span>
                <span className="text-[11px] text-[#77736f]">
                  {product.reviews} reviews
                </span>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <span className="text-2xl font-extrabold">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <>
                    <del className="text-[12px] text-[#96918c]">
                      {formatPrice(product.originalPrice)}
                    </del>
                    <span className="text-[11px] font-bold text-[#d600c7]">
                      {discountPercent(product)}% off
                    </span>
                  </>
                )}
              </div>

              {product.description && (
                <p className="mt-4 max-w-[520px] text-[13px] leading-6 text-[#696663]">
                  {product.description}
                </p>
              )}

              <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold text-[#55805b]">
                <Check size={14} />
                {product.stock}
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                  Available sizes
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <span
                      key={size}
                      className="rounded-lg border border-[#ddd8d1] px-3 py-2 text-[11px] font-semibold text-[#494643]"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={addToCart}
                className={`mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[11px] font-bold transition-colors ${
                  added
                    ? 'bg-[#287335] text-white'
                    : 'gradient-ink text-white hover:opacity-90'
                }`}
              >
                {added ? (
                  <>
                    <Check size={15} /> Added to cart
                  </>
                ) : (
                  <>
                    <Plus size={15} /> Add to cart
                  </>
                )}
              </button>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}

function StatePanel({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-[560px] items-center justify-center">
      <div className="max-w-[420px] rounded-2xl border border-dashed border-[#d8d2ca] bg-white px-7 py-8 text-center">
        <h1 className="text-xl font-extrabold">{title}</h1>
        <p className="mt-2 text-[12px] leading-5 text-[#77736f]">{message}</p>
        <Link
          href="/shop"
          className="mt-5 inline-flex rounded-lg bg-[#171717] px-4 py-2.5 text-[11px] font-bold text-white"
        >
          Return to shop
        </Link>
      </div>
    </div>
  );
}