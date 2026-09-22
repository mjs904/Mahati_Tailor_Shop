'use client';

import Link from 'next/link';
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import Header from '../components/header';
import Footer from '../components/footer';
import { useCart } from '../context/cart-context';
import { useWishlist } from '../context/wishlist-context';
import { formatPrice } from '../data/products';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, itemCount, subtotal, shipping, discount, total } =
    useCart();
  const { isAuthenticated, requireAuth } = useWishlist();

  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      requireAuth(
        'Sign in to checkout',
        'Please sign in or create an account to proceed with your order and delivery details.',
        '/checkout',
      );
    }
  };

  return (
    <main className="market-shell min-h-[100dvh]">
      <Header />
      <div className="market-container pb-20 pt-8">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-label text-[9px] uppercase tracking-[.18em] text-[#4f6bff]">
              Your Selection
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-[-.05em] text-[#171717]">
              Shopping Bag{' '}
              <span className="text-xl font-normal text-[#96918c]">({itemCount} items)</span>
            </h1>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-[11px] font-bold text-[#96918c] transition-colors hover:text-[#d600c7]"
            >
              Clear all items
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-[460px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8d2ca] bg-white p-8 text-center shadow-sm">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f4edf9] text-[#8a3dff]">
              <ShoppingBag size={28} />
            </span>
            <h2 className="mt-4 text-xl font-extrabold text-[#171717]">Your shopping bag is empty</h2>
            <p className="mt-2 max-w-[340px] text-[12px] leading-5 text-[#77736f]">
              Discover celebration-ready Indian fashion, bridal pieces, and made-to-measure tailoring.
            </p>
            <Link
              href="/shop"
              className="gradient-ink mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-[11px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Explore the Collection <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            {/* Items List */}
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#e8e4df] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                    />
                    <div>
                      <span className="font-label text-[9px] uppercase tracking-[.14em] text-[#d600c7]">
                        {item.category}
                      </span>
                      <Link
                        href={`/products/${encodeURIComponent(item.productId)}`}
                        className="mt-0.5 block text-[13px] font-bold text-[#171717] hover:text-[#4f6bff]"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-[#faf8f5] px-2 py-0.5 text-[10px] font-semibold text-[#696663]">
                          Size: {item.size}
                        </span>
                        <span className="text-[12px] font-extrabold text-[#171717]">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    {/* Quantity Selector */}
                    <div className="flex h-9 items-center rounded-lg border border-[#ddd8d1] bg-white px-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                        className="p-1 text-[#696663] hover:text-[#171717]"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="min-w-6 text-center text-[11px] font-bold text-[#171717]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                        className="p-1 text-[#696663] hover:text-[#171717]"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <span className="text-[14px] font-extrabold text-[#171717] sm:w-20 sm:text-right">
                      {formatPrice(item.price * item.quantity)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.size)}
                      className="text-[#aaa] transition-colors hover:text-[#d600c7]"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between rounded-xl border border-[#e8e4df] bg-[#faf8f5] p-4 text-[11px] text-[#696663]">
                <span className="flex items-center gap-2">
                  <Truck size={16} className="text-[#4f6bff]" />
                  Orders over ₹1,999 qualify for complimentary insured shipping.
                </span>
                <Link href="/shop" className="font-bold text-[#4f6bff] hover:underline">
                  + Add more styles
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="sticky top-24 rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm">
                <h2 className="text-[14px] font-extrabold text-[#171717]">Order Summary</h2>

                <div className="mt-4 space-y-2.5 text-[12px]">
                  <div className="flex justify-between text-[#696663]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#171717]">{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-[#696663]">
                    <span>Shipping</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-[#287335]">Free</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-[#d600c7]">
                      <span>Festive Offer Discount</span>
                      <span className="font-bold">-{formatPrice(discount)}</span>
                    </div>
                  )}

                  <div className="border-t border-[#e8e4df] pt-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[14px] font-extrabold text-[#171717]">Total</span>
                        <p className="text-[9px] text-[#96918c]">Inclusive of all taxes</p>
                      </div>
                      <span className="text-2xl font-extrabold text-[#171717]">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={handleCheckoutClick}
                  className="gradient-ink mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold text-white shadow-md transition-opacity hover:opacity-90"
                >
                  Proceed to Checkout <ArrowRight size={15} />
                </Link>

                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#96918c]">
                  <ShieldCheck size={14} className="text-[#287335]" />
                  <span>Insured checkout • Studio backed support</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
