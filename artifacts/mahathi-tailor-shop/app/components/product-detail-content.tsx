'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Heart,
  LoaderCircle,
  Minus,
  Plus,
  Ruler,
  ShoppingBag,
  Star,
  Truck,
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
import { useCart } from '../context/cart-context';
import { useWishlist } from '../context/wishlist-context';

export default function ProductDetailContent() {
  const params = useParams<{ id: string }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const productId = rawId ? decodeURIComponent(rawId) : '';

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await fetchProductById(productId);
        if (!mounted) return;
        setProduct(result.product);
        if (result.product && result.product.sizes.length > 0) {
          setSelectedSize(result.product.sizes[0]);
        }
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

  const wishlisted = product ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, selectedSize || product.sizes[0] || 'Free size', quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="w-full">
      <div className="market-container pb-20 pt-7">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4f6bff] hover:underline"
          >
            <ArrowLeft size={14} /> Back to catalogue
          </Link>
          <div className="flex items-center gap-3 text-[11px] text-[#696663]">
            <Link href="/services/tailoring" className="hover:text-[#4f6bff]">
              Need custom tailoring?
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[560px] flex-col items-center justify-center gap-3">
            <LoaderCircle size={24} className="animate-spin text-[#4f6bff]" />
            <p className="text-[12px] font-semibold text-[#696663]">Loading product details…</p>
          </div>
        ) : error ? (
          <StatePanel
            title="This product could not be loaded"
            message={getInsforgeErrorMessage(
              error,
              'We could not load this product right now. Please check your connection and try again.',
            )}
          />
        ) : !product ? (
          <StatePanel
            title="Product not found"
            message="This piece is not available or has been removed from the boutique collection."
          />
        ) : (
          <article className="grid gap-8 rounded-2xl bg-white p-5 shadow-[0_14px_40px_rgba(23,23,23,.06)] md:grid-cols-[.95fr_1.05fr] md:p-10">
            <div
              className="relative aspect-[.9] overflow-hidden rounded-2xl"
              style={{ backgroundColor: product.tone || '#f4eee7' }}
            >
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {product.badge && (
                <span className="absolute left-4 top-4 rounded-md bg-white/90 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#4f6bff] shadow-sm">
                  {product.badge}
                </span>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <p className="font-label text-[10px] uppercase tracking-[.18em] text-[#d600c7]">
                  {product.category}
                </p>
                <span className="font-label text-[9px] uppercase tracking-[.1em] text-[#96918c]">
                  ID: {product.id.slice(0, 8)}
                </span>
              </div>

              <div className="mt-2 flex items-start justify-between gap-4">
                <h1 className="text-3xl font-extrabold leading-[1.08] tracking-[-.06em] text-[#171717]">
                  {product.name}
                </h1>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label={
                    wishlisted
                      ? `Remove ${product.name} from wishlist`
                      : `Add ${product.name} to wishlist`
                  }
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    wishlisted
                      ? 'border-[#d600c7] bg-[#fff5fc] text-[#d600c7]'
                      : 'border-[#ddd8d1] text-[#696663] hover:border-[#d600c7] hover:text-[#d600c7]'
                  }`}
                >
                  <Heart size={19} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="mt-3.5 flex items-center gap-2">
                <span className="flex items-center gap-1 rounded bg-[#eef8ed] px-2 py-1 text-[10px] font-bold text-[#287335]">
                  <Star size={11} fill="currentColor" /> {product.rating || '4.9'}
                </span>
                <span className="text-[11px] text-[#77736f]">
                  {product.reviews || 18} boutique reviews
                </span>
                <span className="text-[#ddd8d1]">•</span>
                <span className="text-[11px] font-semibold text-[#55805b]">
                  {product.stock || 'In stock'}
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-[#171717]">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <>
                    <del className="text-[14px] text-[#96918c]">
                      {formatPrice(product.originalPrice)}
                    </del>
                    <span className="rounded bg-[#fff0fb] px-2 py-0.5 text-[11px] font-bold text-[#d600c7]">
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

              {/* Sizes Selection */}
              <div className="mt-6 border-t border-[#e8e4df] pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[.08em] text-[#171717]">
                    Select Size
                  </p>
                  <Link
                    href="/services/tailoring"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4f6bff] hover:underline"
                  >
                    <Ruler size={12} /> Custom size fitting
                  </Link>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {product.sizes && product.sizes.length > 0 ? (
                    product.sizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`h-10 min-w-12 rounded-lg border px-3.5 text-[11px] font-bold transition-all ${
                          selectedSize === sz
                            ? 'border-[#4f6bff] bg-[#4f6bff] text-white shadow-sm'
                            : 'border-[#ddd8d1] bg-white text-[#494643] hover:border-[#4f6bff]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedSize('Free size')}
                      className="h-10 rounded-lg border border-[#4f6bff] bg-[#4f6bff] px-4 text-[11px] font-bold text-white"
                    >
                      Free size
                    </button>
                  )}
                </div>
              </div>

              {/* Quantity & Add to Bag */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-11 w-32 items-center justify-between rounded-lg border border-[#ddd8d1] bg-white px-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="text-[#696663] hover:text-[#171717]"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-[12px] font-bold text-[#171717]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="text-[#696663] hover:text-[#171717]"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-[11px] font-bold transition-all ${
                    added
                      ? 'bg-[#287335] text-white shadow-md'
                      : 'gradient-ink text-white shadow-sm hover:opacity-90'
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={16} /> Added to shopping bag!
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={15} /> Add to bag • {formatPrice(product.price * quantity)}
                    </>
                  )}
                </button>
              </div>

              {added && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-[#c9e6d2] bg-[#f3fbf5] p-3 text-[11px] text-[#287335]">
                  <span>Item added to your bag.</span>
                  <Link href="/cart" className="font-bold underline hover:text-[#171717]">
                    View Bag & Checkout →
                  </Link>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 rounded-xl bg-[#faf8f5] p-3.5 text-[11px] text-[#696663]">
                <div className="flex items-center gap-2">
                  <Truck size={15} className="text-[#4f6bff]" />
                  <span>Complimentary delivery on orders over ₹1,999 across India</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler size={15} className="text-[#4f6bff]" />
                  <span>Free blouse alteration support at our Banjara Hills studio</span>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
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
    <div className="flex min-h-[460px] items-center justify-center">
      <div className="max-w-[420px] rounded-2xl border border-dashed border-[#d8d2ca] bg-white px-7 py-8 text-center shadow-sm">
        <h1 className="text-xl font-extrabold text-[#171717]">{title}</h1>
        <p className="mt-2 text-[12px] leading-5 text-[#77736f]">{message}</p>
        <Link
          href="/shop"
          className="mt-5 inline-flex rounded-lg bg-[#171717] px-4 py-2.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
        >
          Return to catalogue
        </Link>
      </div>
    </div>
  );
}