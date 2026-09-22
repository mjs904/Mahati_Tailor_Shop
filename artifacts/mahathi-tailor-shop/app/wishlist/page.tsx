'use client';

import Link from 'next/link';
import { ArrowRight, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import Header from '../components/header';
import Footer from '../components/footer';
import { useWishlist } from '../context/wishlist-context';
import { useCart } from '../context/cart-context';
import { formatPrice } from '../data/products';

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, count, isAuthenticated } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (product: (typeof wishlistItems)[0]) => {
    addToCart(product, product.sizes[0] || 'Free size', 1);
    removeFromWishlist(product.id);
  };

  return (
    <main className="market-shell min-h-[100dvh]">
      <Header />
      <div className="market-container pb-20 pt-8">
        <div className="mb-6">
          <p className="font-label text-[9px] uppercase tracking-[.18em] text-[#d600c7]">
            Saved Styles
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-.05em] text-[#171717]">
            Your Wishlist{' '}
            {isAuthenticated && (
              <span className="text-xl font-normal text-[#96918c]">({count} saved)</span>
            )}
          </h1>
        </div>

        {!isAuthenticated ? (
          <div className="flex min-h-[440px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8d2ca] bg-white p-8 text-center shadow-sm">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0fb] text-[#d600c7]">
              <Heart size={28} />
            </span>
            <h2 className="mt-4 text-xl font-extrabold text-[#171717]">Sign in to view your wishlist</h2>
            <p className="mt-2 max-w-[360px] text-[12px] leading-5 text-[#77736f]">
              Your saved pieces are stored with your Mahati account. Sign in to view your curated styles or create an account.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login?redirect=/wishlist"
                className="gradient-ink inline-flex items-center gap-2 rounded-lg px-5 py-3 text-[11px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Sign In to Account <ArrowRight size={14} />
              </Link>
              <Link
                href="/register?redirect=/wishlist"
                className="inline-flex items-center gap-2 rounded-lg border border-[#ddd8d1] bg-white px-5 py-3 text-[11px] font-bold text-[#2d2b29] shadow-xs transition-colors hover:border-[#4f6bff] hover:text-[#4f6bff]"
              >
                Create Account
              </Link>
            </div>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="flex min-h-[440px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8d2ca] bg-white p-8 text-center shadow-sm">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0fb] text-[#d600c7]">
              <Heart size={28} />
            </span>
            <h2 className="mt-4 text-xl font-extrabold text-[#171717]">Your wishlist is empty</h2>
            <p className="mt-2 max-w-[340px] text-[12px] leading-5 text-[#77736f]">
              Save pieces you love while browsing to easily revisit and order them anytime.
            </p>
            <Link
              href="/shop"
              className="gradient-ink mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-[11px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Discover Pieces <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {wishlistItems.map((product) => (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e8e4df] bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  <div
                    className="relative aspect-[.85] overflow-hidden rounded-xl"
                    style={{ backgroundColor: product.tone || '#faf8f5' }}
                  >
                    <Link href={`/products/${encodeURIComponent(product.id)}`}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#696663] shadow-sm transition-colors hover:text-[#d600c7]"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="pt-3">
                    <span className="font-label text-[9px] uppercase tracking-[.14em] text-[#d600c7]">
                      {product.category}
                    </span>
                    <Link
                      href={`/products/${encodeURIComponent(product.id)}`}
                      className="mt-0.5 block truncate text-[13px] font-bold text-[#171717] hover:text-[#4f6bff]"
                    >
                      {product.name}
                    </Link>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-[14px] font-extrabold text-[#171717]">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <del className="text-[10px] text-[#96918c]">
                          {formatPrice(product.originalPrice)}
                        </del>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleMoveToCart(product)}
                  className="mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#4f6bff] bg-white text-[10px] font-bold text-[#4f6bff] transition-colors hover:bg-[#4f6bff] hover:text-white"
                >
                  <ShoppingBag size={13} /> Move to Bag
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
