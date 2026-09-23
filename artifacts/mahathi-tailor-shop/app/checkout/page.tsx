'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Home,
  LoaderCircle,
  Lock,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import Header from '../components/header';
import Footer from '../components/footer';
import { useCart } from '../context/cart-context';
import { formatPrice } from '../data/products';
import {
  ensureProfileId,
  getCurrentSession,
  getInsforgeErrorMessage,
  getInsforgeTable,
  INSFORGE_TABLES,
  isInsforgeConfigured,
  signInWithGoogle,
} from '../../lib/insforge';

type ShippingForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  paymentMethod: 'cod' | 'razorpay';
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shipping, discount, total, clearCart } = useCart();

  const [form, setForm] = useState<ShippingForm>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '',
    notes: '',
    paymentMethod: 'cod',
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();

  // Load existing user profile if authenticated
  useEffect(() => {
    if (!isInsforgeConfigured()) {
      setLoadingProfile(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const session = await getCurrentSession();
        const currentUser = session.user;
        if (currentUser) {
          const prof = currentUser.profile as any;
          setUserId(currentUser.id);
          setForm((prev) => ({
            ...prev,
            email: currentUser.email || prev.email,
            name: prof?.name || prev.name,
            phone: prof?.phone || (currentUser as any).phone || prev.phone,
          }));

          // Query profiles table for saved address
          try {
            const { data } = await getInsforgeTable(INSFORGE_TABLES.profiles)
              .select()
              .eq('id', currentUser.id)
              .single();

            if (data) {
              setForm((prev) => ({
                ...prev,
                name: data.name || prev.name,
                phone: data.phone || prev.phone,
                address: data.address || prev.address,
                city: data.city || prev.city,
                state: data.state || prev.state,
                pincode: data.pincode || prev.pincode,
              }));
            }
          } catch {
            // ignore if profiles row doesn't exist yet
          }
        }
      } catch {
        // ignore
      } finally {
        setLoadingProfile(false);
      }
    };

    void loadProfile();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(
        typeof window !== 'undefined' ? `${window.location.origin}/checkout` : undefined,
      );
    } catch (err: any) {
      alert(`Could not start Google sign in: ${err?.message || 'Error'}`);
    }
  };

  const handleChange = (field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError('Please sign in or create an account to place an order.');
      return;
    }

    if (items.length === 0) {
      setError('Your shopping bag is empty.');
      return;
    }

    if (!form.name || !form.phone || !form.address || !form.pincode) {
      setError('Please provide your complete delivery name, phone, address, and pincode.');
      return;
    }

    setSubmitting(true);

    try {
      const orderNumber = `MTS-${Date.now().toString(36).toUpperCase()}-${Math.floor(
        Math.random() * 900 + 100,
      )}`;

      // Save order to InsForge if configured
      let createdOrderId = orderNumber;

      if (isInsforgeConfigured()) {
        const activeProfileId = await ensureProfileId({
          id: userId,
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        });

        const orderPayload = {
          user_id: activeProfileId,
          order_number: orderNumber,
          status: 'pending',
          payment_status: 'pending',
          payment_method: form.paymentMethod,
          subtotal: Number(subtotal) || 0,
          shipping_fee: Number(shipping) || 0,
          total_amount: Number(total) || 0,
          discount: Number(discount) || 0,
          shipping_name: form.name.trim(),
          shipping_phone: form.phone.trim(),
          shipping_address: form.address.trim(),
          shipping_city: form.city.trim(),
          shipping_state: form.state.trim(),
          shipping_pincode: form.pincode.trim(),
          notes: form.notes.trim() || null,
        };

        const { data: orderData, error: orderError } = await getInsforgeTable(
          INSFORGE_TABLES.orders,
        )
          .insert(orderPayload)
          .select();

        if (orderError) {
          throw new Error(getInsforgeErrorMessage(orderError, 'Failed to record your order in the boutique system. Please try again.'));
        }

        const createdOrder = Array.isArray(orderData) ? orderData[0] : orderData;

        if (createdOrder?.id) {
          createdOrderId = createdOrder.id;

          // Insert order items
          const isValidUuid = (val?: string | null) =>
            typeof val === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

          const orderItemsPayload = items.map((item) => ({
            order_id: createdOrder.id,
            product_id: isValidUuid(item.productId) ? item.productId : null,
            product_name: `${item.name}${item.size ? ` (${item.size})` : ''}`,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            total: (Number(item.price) || 0) * (Number(item.quantity) || 1),
          }));

          try {
            await getInsforgeTable(INSFORGE_TABLES.orderItems).insert(orderItemsPayload);
          } catch (itemErr) {
            console.warn('Order items insert note:', itemErr);
          }
        }
      }

      // Online payment handling with Razorpay
      if (form.paymentMethod === 'razorpay' && razorpayKey) {
        // Dynamically load Razorpay checkout script
        const loadScript = () =>
          new Promise<boolean>((resolve) => {
            if (typeof window === 'undefined') return resolve(false);
            if ((window as any).Razorpay) return resolve(true);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });

        const scriptLoaded = await loadScript();

        if (scriptLoaded && (window as any).Razorpay) {
          const rzp = new (window as any).Razorpay({
            key: razorpayKey,
            amount: Math.round(total * 100),
            currency: 'INR',
            name: 'Mahathi Tailor Shop',
            description: `Order ${orderNumber}`,
            prefill: {
              name: form.name,
              contact: form.phone,
              email: form.email || undefined,
            },
            theme: {
              color: '#0d1322',
            },
            handler: async (response: any) => {
              // Real gateway success callback
              if (response?.razorpay_payment_id) {
                try {
                  if (createdOrderId) {
                    await getInsforgeTable(INSFORGE_TABLES.orders)
                      .update({ payment_status: 'paid' })
                      .eq('id', createdOrderId);
                  }
                } catch (updateErr) {
                  console.warn('Payment status update note:', updateErr);
                }
                setPaymentSuccess(true);
              }
              clearCart();
              setOrderComplete(orderNumber);
            },
            modal: {
              ondismiss: () => {
                // Payment was cancelled or closed - order remains pending_online
                clearCart();
                setPaymentSuccess(false);
                setOrderComplete(orderNumber);
              },
            },
          });
          rzp.open();
          return;
        }
      }

      // If COD or Razorpay without live key:
      clearCart();
      setPaymentSuccess(false);
      setOrderComplete(orderNumber);
    } catch (err: any) {
      setError(err?.message || 'Could not place order. Please check details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <main className="market-shell min-h-[100dvh]">
        <Header />
        <div className="market-container flex min-h-[500px] items-center justify-center py-16">
          <div className="w-full max-w-lg rounded-2xl border border-[#c9e6d2] bg-white p-8 text-center shadow-lg">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3fbf5] text-[#287335]">
              <CheckCircle2 size={36} />
            </span>
            <span className="mt-4 inline-block font-label text-[10px] uppercase tracking-[.18em] text-[#287335]">
              Order Confirmed
            </span>
            <h1 className="mt-1 text-2xl font-extrabold text-[#171717]">
              Thank you for ordering with Mahathi
            </h1>
            <p className="mt-2 text-[12px] leading-5 text-[#696663]">
              Your order has been recorded. Our master tailors and stylists will prepare your
              pieces with utmost care.
            </p>

            <div className="my-6 rounded-xl border border-[#e8e4df] bg-[#faf8f5] p-4 text-left text-[11px] space-y-1">
              <div className="flex justify-between py-1">
                <span className="text-[#96918c]">Order Reference:</span>
                <strong className="font-mono text-[#171717]">{orderComplete}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#96918c]">Payment Mode:</span>
                <span className="font-bold text-[#171717]">
                  {form.paymentMethod === 'cod'
                    ? 'Cash on Delivery / Studio Fitting'
                    : 'Online Payment (Razorpay)'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#96918c]">Payment Status:</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    paymentSuccess
                      ? 'bg-[#e7f7ed] text-[#1c783c]'
                      : 'bg-[#fef6e7] text-[#a46e12]'
                  }`}
                >
                  {paymentSuccess ? '✓ Paid' : '⏳ Pending Online / Studio Settlement'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#96918c]">Estimated Delivery:</span>
                <span className="font-bold text-[#171717]">3–5 Business Days</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#96918c]">Delivery To:</span>
                <span className="text-right text-[#171717]">
                  {form.name}, {form.city}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/shop"
                className="gradient-ink flex-1 rounded-xl py-3 text-[11px] font-bold text-white shadow-sm"
              >
                Continue Browsing
              </Link>
              <Link
                href="/account"
                className="flex-1 rounded-xl border border-[#ddd8d1] bg-white py-3 text-[11px] font-bold text-[#171717] hover:bg-[#faf8f5]"
              >
                View Account Orders
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!loadingProfile && !userId) {
    return (
      <main className="market-shell min-h-[100dvh]">
        <Header />
        <div className="market-container flex min-h-[500px] items-center justify-center py-16">
          <div className="w-full max-w-md rounded-2xl border border-[#e8e4df] bg-white p-8 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f7f5ff] text-[#4f6bff]">
              <Lock size={26} />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-[#171717]">Sign in to Checkout</h1>
            <p className="mt-2 text-[12px] leading-5 text-[#696663]">
              Please sign in or create an account to securely complete your order and track doorstep delivery.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[#ddd8d1] bg-white text-[12px] font-bold text-[#2d2b29] shadow-xs transition-colors hover:border-[#b8b3ac] hover:bg-[#faf8f5]"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative my-2 flex items-center justify-center">
                <div className="w-full border-t border-[#e8e4df]" />
                <span className="absolute bg-white px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8c8883]">
                  or email
                </span>
              </div>

              <Link
                href="/login?redirect=/checkout"
                className="gradient-ink flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-bold text-white shadow-sm"
              >
                Sign In with Email
              </Link>
              <Link
                href="/register?redirect=/checkout"
                className="flex h-11 w-full items-center justify-center rounded-lg border border-[#ddd8d1] bg-white text-[12px] font-bold text-[#2d2b29] hover:bg-[#faf8f5]"
              >
                Create Account
              </Link>
              <Link href="/cart" className="block pt-2 text-[11px] text-[#8c8883] hover:underline">
                ← Return to shopping bag
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="market-shell min-h-[100dvh]">
        <Header />
        <div className="market-container flex min-h-[460px] flex-col items-center justify-center py-16 text-center">
          <h2 className="text-2xl font-extrabold text-[#171717]">Your bag is empty</h2>
          <p className="mt-2 text-[12px] text-[#696663]">Add pieces to your bag before checking out.</p>
          <Link
            href="/shop"
            className="gradient-ink mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-[11px] font-bold text-white shadow-sm"
          >
            <ArrowLeft size={14} /> Back to catalogue
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="market-shell min-h-[100dvh]">
      <Header />
      <div className="market-container pb-20 pt-8">
        <Link
          href="/cart"
          className="mb-6 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4f6bff] hover:underline"
        >
          <ArrowLeft size={14} /> Return to shopping bag
        </Link>

        <div className="mb-6">
          <p className="font-label text-[9px] uppercase tracking-[.18em] text-[#4f6bff]">
            Final Step
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-.05em] text-[#171717]">
            Delivery & Checkout
          </h1>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-[#f1c9c9] bg-[#fff5f5] p-4 text-[12px] text-[#a64242]">
            {error}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Shipping & Payment Form */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-2 border-b border-[#e8e4df] pb-4">
                <Truck size={18} className="text-[#4f6bff]" />
                <h2 className="text-[14px] font-extrabold text-[#171717]">
                  Delivery Address & Contact
                </h2>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Recipient's name"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 90000 00000"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="order.updates@example.com"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Street Address / Flat / Landmark *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="House/Plot no., building, street or colony"
                    className="mt-1.5 w-full rounded-lg border border-[#ddd8d1] bg-white p-3 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    placeholder="500034"
                    maxLength={6}
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Delivery / Tailoring Notes
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="E.g., Call before delivery, urgent wedding date"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-2 border-b border-[#e8e4df] pb-4">
                <CreditCard size={18} className="text-[#4f6bff]" />
                <h2 className="text-[14px] font-extrabold text-[#171717]">Payment Method</h2>
              </div>

              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ddd8d1] p-4 transition-all has-[:checked]:border-[#4f6bff] has-[:checked]:bg-[#faf8f5]">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={form.paymentMethod === 'cod'}
                    onChange={() => handleChange('paymentMethod', 'cod')}
                    className="mt-0.5 accent-[#4f6bff]"
                  />
                  <div>
                    <strong className="block text-[12px] font-bold text-[#171717]">
                      Cash on Delivery / Pay on Studio Fitting
                    </strong>
                    <p className="mt-0.5 text-[11px] text-[#696663]">
                      Pay when your package arrives or when you visit our Banjara Hills studio for
                      your trial.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ddd8d1] p-4 transition-all has-[:checked]:border-[#4f6bff] has-[:checked]:bg-[#faf8f5]">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={form.paymentMethod === 'razorpay'}
                    onChange={() => handleChange('paymentMethod', 'razorpay')}
                    className="mt-0.5 accent-[#4f6bff]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-[12px] font-bold text-[#171717]">
                        Online Payment (UPI, Cards, NetBanking)
                      </strong>
                      <span className="rounded bg-[#eee5d7] px-1.5 py-0.5 text-[9px] font-bold text-[#806728]">
                        {razorpayKey ? 'Razorpay' : 'Pending Gateway Key'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#696663]">
                      Seamless online payment through UPI (GPay, PhonePe, Paytm), Credit/Debit Cards,
                      or NetBanking.
                      {!razorpayKey && (
                        <span className="mt-1 block font-medium text-[#806728]">
                          (Notice: Online gateway key not yet provided in environment. Order will be recorded with pending online status; our studio team will send your secure payment link).
                        </span>
                      )}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Review Sidebar */}
          <div>
            <div className="sticky top-24 rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm">
              <h2 className="text-[14px] font-extrabold text-[#171717]">Review ({items.length} items)</h2>

              <div className="mt-4 max-h-56 divide-y divide-[#f0edf7] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5 text-[11px]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-[#171717]">{item.name}</p>
                      <p className="text-[#96918c]">
                        Size: {item.size} • Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-extrabold text-[#171717]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-[#e8e4df] pt-4 space-y-2 text-[12px]">
                <div className="flex justify-between text-[#696663]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#171717]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#696663]">
                  <span>Insured Delivery</span>
                  <span className="font-semibold">
                    {shipping === 0 ? (
                      <span className="text-[#287335]">Complimentary</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#d600c7]">
                    <span>Festive Discount</span>
                    <span className="font-bold">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="border-t border-[#e8e4df] pt-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[14px] font-extrabold text-[#171717]">Final Amount</span>
                      <p className="text-[9px] text-[#96918c]">All duties & taxes included</p>
                    </div>
                    <span className="text-2xl font-extrabold text-[#171717]">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="gradient-ink mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" /> Placing your order…
                  </>
                ) : (
                  <>
                    <Lock size={14} /> Confirm & Place Order • {formatPrice(total)}
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#96918c]">
                <ShieldCheck size={14} className="text-[#287335]" />
                <span>SSL Encrypted Checkout • Hyderabad Workroom Guarantee</span>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </main>
  );
}
