'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, LoaderCircle, Lock, Ruler, Scissors, Sparkles, Truck } from 'lucide-react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import AuthModal from '../../components/auth-modal';
import { ensureProfileId, getCurrentSession, getInsforgeTable, INSFORGE_TABLES, isInsforgeConfigured } from '../../../lib/insforge';

type ServiceType = 'Blouse Stitching' | 'Kurta Set' | 'Lehenga Ensemble' | 'Express Alterations';

export default function TailoringPage() {
  const [serviceType, setServiceType] = useState<ServiceType>('Blouse Stitching');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [shoulder, setShoulder] = useState('');
  const [sleeveLength, setSleeveLength] = useState('');
  const [blouseLength, setBlouseLength] = useState('');
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!isInsforgeConfigured()) return;
    const checkUser = async () => {
      try {
        const session = await getCurrentSession();
        if (session.user) {
          const prof = session.user.profile as any;
          setUserId(session.user.id);
          setCustomerName(prof?.name || '');
          setCustomerPhone(prof?.phone || (session.user as any).phone || '');
        }
      } catch {
        // ignore
      }
    };
    void checkUser();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setShowAuthModal(true);
      setError('Please sign in or create an account to submit a tailoring order.');
      return;
    }

    setSubmitting(true);

    try {
      let measurementId: string | null = null;

      if (isInsforgeConfigured()) {
        const activeProfileId = await ensureProfileId({
          id: userId,
          name: customerName,
          phone: customerPhone,
        });

        // 1. Save measurements if provided
        if (bust || waist || shoulder || sleeveLength || blouseLength) {
          try {
            const { data: measurementData } = await getInsforgeTable(INSFORGE_TABLES.measurements)
              .insert({
                user_id: activeProfileId,
                bust: bust ? parseFloat(bust) : null,
                waist: waist ? parseFloat(waist) : null,
                shoulder: shoulder ? parseFloat(shoulder) : null,
                sleeve_length: sleeveLength ? parseFloat(sleeveLength) : null,
                blouse_length: blouseLength ? parseFloat(blouseLength) : null,
                notes: `Client: ${customerName}, Phone: ${customerPhone}`,
              })
              .select()
              .single();

            if (measurementData?.id) {
              measurementId = measurementData.id;
            }
          } catch (mErr) {
            console.warn('Measurements save notice:', mErr);
          }
        }

        // 2. Save tailoring request
        const tailoringPayload = {
          user_id: activeProfileId,
          service_type: serviceType,
          notes: `${customerName ? `Contact: ${customerName} (${customerPhone}) | ` : ''}${notes}`.trim(),
          status: 'pending',
          measurement_id: measurementId,
          reference_images: [],
          estimated_price: serviceType === 'Blouse Stitching' ? 1200 : serviceType === 'Kurta Set' ? 1800 : 3500,
        };

        const { data: requestData, error: requestError } = await getInsforgeTable(
          INSFORGE_TABLES.tailoringRequests,
        )
          .insert(tailoringPayload)
          .select()
          .single();

        if (requestError) {
          console.warn('Tailoring request notice:', requestError);
        }

        setSuccessId(requestData?.id || `REQ-${Date.now().toString(36).toUpperCase()}`);
      } else {
        setSuccessId(`REQ-${Date.now().toString(36).toUpperCase()}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="market-shell min-h-[100dvh]">
      <Header />
      <div className="market-container pb-20 pt-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4f6bff] hover:underline"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>

        {/* Hero Section */}
        <div className="relative mb-10 overflow-hidden rounded-2xl bg-[#171717] p-8 text-white md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,.15),transparent_40%)]" />
          <div className="relative z-10 max-w-2xl">
            <span className="font-label text-[9px] uppercase tracking-[.2em] text-[#d4af37]">
              Hyderabad Workroom • Made-to-Measure
            </span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-.05em] sm:text-4xl">
              Boutique Tailoring & Fittings
            </h1>
            <p className="mt-3 text-[13px] leading-6 text-white/80">
              Submit your bespoke blouse, kurta set, or alteration measurements. Our master cut
              specialists craft each silhouette to complement your exact posture and proportions.
            </p>
          </div>
        </div>

        {successId ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-[#c9e6d2] bg-white p-8 text-center shadow-md">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3fbf5] text-[#287335]">
              <CheckCircle2 size={36} />
            </span>
            <span className="mt-4 inline-block font-label text-[10px] uppercase tracking-[.18em] text-[#287335]">
              Request Received
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-[#171717]">
              We have received your tailoring order
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#696663]">
              Reference ID:{' '}
              <strong className="font-mono text-[#171717]">{successId.slice(0, 12)}</strong>.
              Our atelier stylist will contact you via WhatsApp / phone to confirm fabric details
              and trial schedule.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setSuccessId(null)}
                className="flex-1 rounded-xl border border-[#ddd8d1] py-3 text-[11px] font-bold text-[#171717] hover:bg-[#faf8f5]"
              >
                Submit another request
              </button>
              <Link
                href="/appointments"
                className="gradient-ink flex-1 rounded-xl py-3 text-[11px] font-bold text-white shadow-sm"
              >
                Book Studio Trial
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
            {!userId && (
              <div className="flex items-start gap-3 rounded-xl border border-[#f5e0b8] bg-[#fffbf2] p-4 text-[#8a651a]">
                <Lock size={18} className="mt-0.5 shrink-0 text-[#8a651a]" />
                <div className="text-[12px] leading-5">
                  <p className="font-bold text-[#171717]">Sign in required to request tailoring</p>
                  <p className="mt-0.5 text-[#735415]">
                    Please{' '}
                    <Link href="/login?redirect=/services/tailoring" className="font-bold text-[#4f6bff] underline hover:text-[#171717]">
                      sign in
                    </Link>{' '}
                    or{' '}
                    <Link href="/register?redirect=/services/tailoring" className="font-bold text-[#4f6bff] underline hover:text-[#171717]">
                      create an account
                    </Link>{' '}
                    so our master tailors can link your measurements and garment requests to your account.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-[#f1c9c9] bg-[#fff5f5] p-4 text-[12px] text-[#a64242]">
                {error}
              </div>
            )}

            {/* Step 1: Select Service */}
            <div className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-2 border-b border-[#e8e4df] pb-4">
                <Scissors size={18} className="text-[#4f6bff]" />
                <h2 className="text-[14px] font-extrabold text-[#171717]">
                  1. Select Garment Type
                </h2>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    ['Blouse Stitching', 'Starting ₹1,200', 'Princess cut, katori, or designer'],
                    ['Kurta Set', 'Starting ₹1,800', 'Straight cut, A-line, with pants'],
                    ['Lehenga Ensemble', 'Starting ₹3,500', 'Full kalidar or contemporary'],
                    ['Express Alterations', 'Starting ₹450', 'Quick tapering, sleeve refit'],
                  ] as const
                ).map(([name, price, note]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setServiceType(name)}
                    className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                      serviceType === name
                        ? 'border-[#4f6bff] bg-[#f7f8ff] shadow-sm'
                        : 'border-[#e8e4df] bg-white hover:border-[#4f6bff]'
                    }`}
                  >
                    <div>
                      <strong className="block text-[12px] font-bold text-[#171717]">{name}</strong>
                      <span className="mt-1 block text-[10px] text-[#96918c]">{note}</span>
                    </div>
                    <span className="mt-3 font-mono text-[10px] font-bold text-[#4f6bff]">{price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Measurements */}
            <div className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between border-b border-[#e8e4df] pb-4">
                <div className="flex items-center gap-2">
                  <Ruler size={18} className="text-[#4f6bff]" />
                  <h2 className="text-[14px] font-extrabold text-[#171717]">
                    2. Body Measurements (Inches)
                  </h2>
                </div>
                <span className="text-[10px] text-[#96918c]">Optional if visiting studio</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Bust (inches)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={bust}
                    onChange={(e) => setBust(e.target.value)}
                    placeholder="e.g. 36"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Waist (inches)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    placeholder="e.g. 30"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Shoulder (inches)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={shoulder}
                    onChange={(e) => setShoulder(e.target.value)}
                    placeholder="e.g. 14.5"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Sleeve Length (inches)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={sleeveLength}
                    onChange={(e) => setSleeveLength(e.target.value)}
                    placeholder="e.g. 10.5"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Blouse / Top Length
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={blouseLength}
                    onChange={(e) => setBlouseLength(e.target.value)}
                    placeholder="e.g. 14"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div className="flex items-center rounded-lg bg-[#faf8f5] p-3 text-[10px] text-[#696663]">
                  <span>Prefer in-person measurement? Leave blank and book a studio visit.</span>
                </div>
              </div>
            </div>

            {/* Step 3: Instructions & Contact */}
            <div className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-2 border-b border-[#e8e4df] pb-4">
                <Sparkles size={18} className="text-[#4f6bff]" />
                <h2 className="text-[14px] font-extrabold text-[#171717]">
                  3. Contact & Styling Notes
                </h2>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Phone Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 90000 00000"
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Design / Neckline / Fabric Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g., Sweetheart neckline in front, deep round back with tassels, padded cups required."
                    className="mt-1.5 w-full rounded-lg border border-[#ddd8d1] bg-white p-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="gradient-ink mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" /> Submitting to Atelier…
                  </>
                ) : (
                  'Submit Custom Tailoring Request'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
      <Footer />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign in required"
        message="Please sign in or create an account to submit your bespoke tailoring request."
        redirectPath="/services/tailoring"
      />
    </main>
  );
}
