'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, HeartHandshake, LoaderCircle, Lock, Sparkles, Star } from 'lucide-react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import AuthModal from '../../components/auth-modal';
import { ensureProfileId, getCurrentSession, getInsforgeTable, INSFORGE_TABLES, isInsforgeConfigured } from '../../../lib/insforge';

export default function BridalPage() {
  const [workType, setWorkType] = useState('Bridal Maggam / Aari Blouse');
  const [notes, setNotes] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!isInsforgeConfigured()) return;
    const loadSession = async () => {
      try {
        const session = await getCurrentSession();
        if (session.user) {
          const prof = session.user.profile as any;
          setUserId(session.user.id);
          setName(prof?.name || '');
          setPhone(prof?.phone || (session.user as any).phone || '');
        }
      } catch {
        // ignore
      }
    };
    void loadSession();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setShowAuthModal(true);
      setError('Please sign in or create an account to request a bridal consultation.');
      return;
    }

    setSubmitting(true);

    try {
      const notesFormatted = `${name ? `Client: ${name} (${phone}) | ` : ''}${targetDate ? `Occasion Date: ${targetDate} | ` : ''}Type: ${workType} | Details: ${notes}`.trim();

      if (isInsforgeConfigured()) {
        const activeProfileId = await ensureProfileId({
          id: userId,
          name,
          phone,
        });

        const { data, error: insertError } = await getInsforgeTable(INSFORGE_TABLES.aariRequests)
          .insert({
            user_id: activeProfileId,
            notes: notesFormatted,
            status: 'pending',
            reference_images: [],
            estimated_price: workType.includes('Heavy') ? 9500 : 5500,
          })
          .select()
          .single();

        if (insertError) {
          console.warn('Aari request notice:', insertError);
        }

        setSuccess(data?.id || `AARI-${Date.now().toString(36).toUpperCase()}`);
      } else {
        setSuccess(`AARI-${Date.now().toString(36).toUpperCase()}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit bridal consultation request.');
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
        <div className="relative mb-12 overflow-hidden rounded-2xl bg-[#261528] p-8 text-white md:p-14">
          <img
            src="/aari-blouse.jpg"
            alt="Handcrafted Aari bridal embroidery"
            className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#261528] via-[#261528]/80 to-transparent" />
          <div className="relative z-10 max-w-2xl">
            <span className="font-label text-[10px] uppercase tracking-[.22em] text-[#d4af37]">
              Mahathi Bridal Atelier • Hyderabad
            </span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-.05em] sm:text-5xl">
              Handcrafted Aari & Bridal Couture
            </h1>
            <p className="mt-4 text-[13px] leading-6 text-white/80">
              Each motif is individually sketched, framed, and stitched with authentic zardozi,
              pearls, and micro-sequins in our Banjara Hills workroom. Designed around your
              muhurtham palette and personal heirloom story.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#consultation"
                className="gradient-ink rounded-xl px-5 py-3 text-[11px] font-bold text-white shadow-md"
              >
                Request Custom Aari Estimate
              </a>
              <Link
                href="/appointments"
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-[11px] font-bold text-white backdrop-blur-sm hover:bg-white/20"
              >
                Book In-Studio Fitting
              </Link>
            </div>
          </div>
        </div>

        {/* Highlight Grid */}
        <div className="mb-14 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm">
            <Sparkles size={22} className="text-[#d600c7]" />
            <h3 className="mt-3 text-[14px] font-bold text-[#171717]">Pure Zari & Silk Thread</h3>
            <p className="mt-2 text-[12px] leading-5 text-[#696663]">
              Authentic gold and antique copper zari embroidery that reflects studio lighting with
              warmth and depth.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm">
            <HeartHandshake size={22} className="text-[#4f6bff]" />
            <h3 className="mt-3 text-[14px] font-bold text-[#171717]">Bespoke Neckline Drafting</h3>
            <p className="mt-2 text-[12px] leading-5 text-[#696663]">
              Front and back necklines custom proportioned to your jewelry setting, saree border
              placement, and hair drape.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm">
            <Star size={22} className="text-[#d4af37]" />
            <h3 className="mt-3 text-[14px] font-bold text-[#171717]">Two-Stage Fitting Trial</h3>
            <p className="mt-2 text-[12px] leading-5 text-[#696663]">
              Raw-canvas fit check followed by the finished embroidery trial to guarantee 100%
              comfort on your wedding day.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div id="consultation" className="mx-auto max-w-2xl scroll-mt-24">
          {success ? (
            <div className="rounded-2xl border border-[#c9e6d2] bg-white p-8 text-center shadow-md">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3fbf5] text-[#287335]">
                <CheckCircle2 size={36} />
              </span>
              <span className="mt-4 inline-block font-label text-[10px] uppercase tracking-[.18em] text-[#287335]">
                Bridal Consultation Requested
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-[#171717]">
                We have registered your bridal handwork request
              </h2>
              <p className="mt-2 text-[12px] leading-5 text-[#696663]">
                Reference ID:{' '}
                <strong className="font-mono text-[#171717]">{success.slice(0, 12)}</strong>.
                Our head bridal designer will review your notes and contact you with design sketches
                and a timeline.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/appointments"
                  className="gradient-ink flex-1 rounded-xl py-3 text-[11px] font-bold text-white shadow-sm"
                >
                  Schedule Studio Fitting Visit
                </Link>
                <Link
                  href="/shop?category=Bridal"
                  className="flex-1 rounded-xl border border-[#ddd8d1] bg-white py-3 text-[11px] font-bold text-[#171717] hover:bg-[#faf8f5]"
                >
                  Explore Ready Bridal Pieces
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm sm:p-8">
              <div className="border-b border-[#e8e4df] pb-4">
                <p className="font-label text-[9px] uppercase tracking-[.18em] text-[#d600c7]">
                  Atelier Consultation
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#171717]">
                  Tell Us About Your Occasion
                </h2>
              </div>

              {!userId && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#f5e0b8] bg-[#fffbf2] p-4 text-[#8a651a]">
                  <Lock size={18} className="mt-0.5 shrink-0 text-[#8a651a]" />
                  <div className="text-[12px] leading-5">
                    <p className="font-bold text-[#171717]">Sign in required for bridal requests</p>
                    <p className="mt-0.5 text-[#735415]">
                      Please{' '}
                      <Link href="/login?redirect=/services/bridal" className="font-bold text-[#4f6bff] underline hover:text-[#171717]">
                        sign in
                      </Link>{' '}
                      or{' '}
                      <Link href="/register?redirect=/services/bridal" className="font-bold text-[#4f6bff] underline hover:text-[#171717]">
                        create an account
                      </Link>{' '}
                      so our bridal stylists can link your occasion timeline to your account.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-[#f1c9c9] bg-[#fff5f5] p-3.5 text-[11px] text-[#a64242]">
                  {error}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Handwork & Service Category *
                  </label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3 text-[12px] outline-none focus:border-[#4f6bff]"
                  >
                    <option>Bridal Maggam / Aari Blouse (All-over motif)</option>
                    <option>Sleeve Border & Neckline Aari Embroidery</option>
                    <option>Custom Bridal Lehenga Ensemble</option>
                    <option>Mother-of-the-Bride / Saree Matching Work</option>
                    <option>Custom Dupatta Border Handwork</option>
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Bride or client name"
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 90000 00000"
                      className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Wedding / Event Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Design Ideas, Saree Color & Motif Notes
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g., Peacock and floral motifs on plum pattu saree, heavy sleeve work, round back with tassels."
                    className="mt-1.5 w-full rounded-lg border border-[#ddd8d1] bg-white p-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="gradient-ink mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" /> Submitting…
                    </>
                  ) : (
                    'Request Bridal Design Estimate'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign in required"
        message="Please sign in or create an account to request a bridal consultation."
        redirectPath="/services/bridal"
      />
    </main>
  );
}
