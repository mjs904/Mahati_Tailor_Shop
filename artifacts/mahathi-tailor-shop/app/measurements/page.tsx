'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Ruler,
  Scissors,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Header from '../components/header';
import Footer from '../components/footer';
import {
  ensureProfileId,
  getCurrentSession,
  getInsforgeTable,
  INSFORGE_TABLES,
  isInsforgeConfigured,
} from '../../lib/insforge';

export default function MeasurementsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [shoulder, setShoulder] = useState('');
  const [sleeveLength, setSleeveLength] = useState('');
  const [blouseLength, setBlouseLength] = useState('');
  const [notes, setNotes] = useState('');

  const [savedMeasurements, setSavedMeasurements] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user session & saved measurements
  useEffect(() => {
    if (!isInsforgeConfigured()) return;

    const loadUserData = async () => {
      try {
        const session = await getCurrentSession();
        if (session.user) {
          const prof = session.user.profile as any;
          setUserId(session.user.id);
          setUserEmail(session.user.email || '');
          setUserName(prof?.name || '');
          setUserPhone(prof?.phone || (session.user as any).phone || '');

          setLoadingSaved(true);
          try {
            const { data } = await getInsforgeTable(INSFORGE_TABLES.measurements)
              .select()
              .eq('user_id', session.user.id)
              .order('created_at', { ascending: false });

            if (data && data.length > 0) {
              setSavedMeasurements(data);
              // Pre-fill latest measurements into form
              const latest = data[0];
              if (latest.bust) setBust(String(latest.bust));
              if (latest.waist) setWaist(String(latest.waist));
              if (latest.shoulder) setShoulder(String(latest.shoulder));
              if (latest.sleeve_length) setSleeveLength(String(latest.sleeve_length));
              if (latest.blouse_length) setBlouseLength(String(latest.blouse_length));
            }
          } catch (fetchErr) {
            console.warn('Saved measurements fetch note:', fetchErr);
          } finally {
            setLoadingSaved(false);
          }
        }
      } catch (err) {
        console.warn('User session check note:', err);
      }
    };

    void loadUserData();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!userName.trim() || !userPhone.trim()) {
      setError('Please provide your name and contact phone number.');
      setSubmitting(false);
      return;
    }

    if (!bust && !waist && !shoulder && !sleeveLength && !blouseLength) {
      setError('Please provide at least one body measurement in inches.');
      setSubmitting(false);
      return;
    }

    try {
      if (isInsforgeConfigured()) {
        const activeProfileId = await ensureProfileId({
          id: userId,
          name: userName.trim(),
          phone: userPhone.trim(),
          email: userEmail.trim() || undefined,
        });

        const payload = {
          user_id: activeProfileId,
          bust: bust ? parseFloat(bust) : null,
          waist: waist ? parseFloat(waist) : null,
          shoulder: shoulder ? parseFloat(shoulder) : null,
          sleeve_length: sleeveLength ? parseFloat(sleeveLength) : null,
          blouse_length: blouseLength ? parseFloat(blouseLength) : null,
          notes: notes.trim()
            ? `${notes.trim()} (Contact: ${userName}, ${userPhone})`
            : `Client: ${userName}, Phone: ${userPhone}`,
        };

        const { data, error: insertError } = await getInsforgeTable(INSFORGE_TABLES.measurements)
          .insert(payload)
          .select()
          .single();

        if (insertError) {
          console.warn('Measurements insert note:', insertError);
        }

        if (data) {
          setSavedMeasurements((prev) => [data, ...prev]);
        }
      }

      setSubmittedSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Could not record measurements. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="market-shell min-h-[100dvh]">
      <Header />
      <div className="market-container pb-20 pt-8">
        <Link
          href="/services/tailoring"
          className="mb-6 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4f6bff] hover:underline"
        >
          <ArrowLeft size={14} /> Bespoke Tailoring Services
        </Link>

        {/* Hero Banner */}
        <div className="rounded-3xl border border-[#e8e4df] bg-gradient-to-br from-[#faf8f5] via-white to-[#f0edf7] p-8 shadow-sm sm:p-12">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0edf7] px-3 py-1 font-label text-[9px] uppercase tracking-[.18em] text-[#4f6bff]">
              <Ruler size={12} /> Bespoke Fitting Profile
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-.05em] text-[#171717] sm:text-4xl">
              Precision Measurements
            </h1>
            <p className="mt-3 text-[13px] leading-6 text-[#696663]">
              Save your bust, waist, shoulder, and sleeve dimensions directly with our Hyderabad
              workroom. Your measurements are securely scoped to your profile and used across all
              your custom tailoring and bridal couture orders.
            </p>
          </div>
        </div>

        {submittedSuccess ? (
          <div className="mt-8 rounded-2xl border border-[#c9e6d2] bg-white p-8 text-center shadow-md">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3fbf5] text-[#287335]">
              <CheckCircle2 size={36} />
            </span>
            <span className="mt-4 inline-block font-label text-[10px] uppercase tracking-[.18em] text-[#287335]">
              Measurements Recorded
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-[#171717]">
              Saved to Your Fitting Profile
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#696663]">
              Our master tailors now have your sizing on file. You can reference this profile for any
              future orders or book a studio trial for final adjustments.
            </p>

            <div className="mx-auto my-6 max-w-md rounded-xl border border-[#e8e4df] bg-[#faf8f5] p-4 text-left text-[11px] space-y-2">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div>
                  <span className="text-[#96918c]">Bust:</span>{' '}
                  <strong className="text-[#171717]">{bust || '—'} in</strong>
                </div>
                <div>
                  <span className="text-[#96918c]">Waist:</span>{' '}
                  <strong className="text-[#171717]">{waist || '—'} in</strong>
                </div>
                <div>
                  <span className="text-[#96918c]">Shoulder:</span>{' '}
                  <strong className="text-[#171717]">{shoulder || '—'} in</strong>
                </div>
                <div>
                  <span className="text-[#96918c]">Sleeve:</span>{' '}
                  <strong className="text-[#171717]">{sleeveLength || '—'} in</strong>
                </div>
                <div>
                  <span className="text-[#96918c]">Length:</span>{' '}
                  <strong className="text-[#171717]">{blouseLength || '—'} in</strong>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/services/tailoring"
                className="gradient-ink rounded-xl px-6 py-3 text-[11px] font-bold text-white shadow-sm"
              >
                Submit Tailoring Request
              </Link>
              <Link
                href="/appointments"
                className="rounded-xl border border-[#ddd8d1] bg-white px-6 py-3 text-[11px] font-bold text-[#171717] hover:bg-[#faf8f5]"
              >
                Book Fitting Trial
              </Link>
              <button
                type="button"
                onClick={() => setSubmittedSuccess(false)}
                className="rounded-xl border border-[#e8e4df] px-4 py-3 text-[11px] font-medium text-[#696663] hover:text-[#171717]"
              >
                Update Values
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="text-[15px] font-extrabold text-[#171717]">
                Submit / Update Measurements
              </h2>
              <p className="mt-1 text-[11px] text-[#696663]">
                Use a standard measuring tape in inches. For guidance, visit our Banjara Hills
                studio or request a master stylist call.
              </p>

              {error && (
                <div className="mt-4 rounded-xl border border-[#f1c9c9] bg-[#fff5f5] p-3 text-[11px] text-[#a64242]">
                  {error}
                </div>
              )}

              {/* Contact Info */}
              <div className="mt-5 border-t border-[#e8e4df] pt-4">
                <h3 className="font-label text-[9px] uppercase tracking-[.14em] text-[#96918c]">
                  Client Details
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Your full name"
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
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+91 90000 00000"
                      className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                    />
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div className="mt-6 border-t border-[#e8e4df] pt-4">
                <h3 className="font-label text-[9px] uppercase tracking-[.14em] text-[#96918c]">
                  Dimensions (Inches)
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                      Bust / Chest
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="20"
                      max="60"
                      value={bust}
                      onChange={(e) => setBust(e.target.value)}
                      placeholder="e.g. 36"
                      className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                      Waist
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="20"
                      max="60"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      placeholder="e.g. 30"
                      className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                      Shoulder Width
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max="30"
                      value={shoulder}
                      onChange={(e) => setShoulder(e.target.value)}
                      placeholder="e.g. 14.5"
                      className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                      Sleeve Length
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="4"
                      max="40"
                      value={sleeveLength}
                      onChange={(e) => setSleeveLength(e.target.value)}
                      placeholder="e.g. 10.5"
                      className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                      Blouse / Garment Length
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max="60"
                      value={blouseLength}
                      onChange={(e) => setBlouseLength(e.target.value)}
                      placeholder="e.g. 14"
                      className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-5">
                <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                  Fitting Notes & Style Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., Deep back neck, princess cut, padded cups, snug armhole"
                  className="mt-1.5 w-full rounded-lg border border-[#ddd8d1] bg-white p-3 text-[12px] outline-none focus:border-[#4f6bff]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="gradient-ink mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" /> Saving measurements…
                  </>
                ) : (
                  <>
                    <Ruler size={14} /> Save Measurements
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#96918c]">
                <ShieldCheck size={14} className="text-[#287335]" />
                <span>Protected by Mahathi Client Privacy Guarantee</span>
              </div>
            </form>

            {/* Sidebar Guide & History */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#e8e4df] bg-[#faf8f5] p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-[13px] font-extrabold text-[#171717]">
                  <Sparkles size={16} className="text-[#d4af37]" /> How We Measure
                </h3>
                <ul className="mt-3 space-y-2 text-[11px] leading-5 text-[#696663]">
                  <li>
                    <strong className="text-[#171717]">Bust:</strong> Around fullest part of bust, keeping tape straight across back.
                  </li>
                  <li>
                    <strong className="text-[#171717]">Waist:</strong> Around natural waistline, just above the navel.
                  </li>
                  <li>
                    <strong className="text-[#171717]">Shoulder:</strong> Tip to tip of shoulder bone across upper back.
                  </li>
                  <li>
                    <strong className="text-[#171717]">Sleeve:</strong> From shoulder seam down to desired sleeve hem.
                  </li>
                </ul>
              </div>

              {/* Saved History */}
              <div className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm">
                <h3 className="text-[13px] font-extrabold text-[#171717]">Saved Records</h3>
                {loadingSaved ? (
                  <div className="flex h-24 items-center justify-center">
                    <LoaderCircle size={16} className="animate-spin text-[#4f6bff]" />
                  </div>
                ) : savedMeasurements.length === 0 ? (
                  <p className="mt-2 text-[11px] text-[#96918c]">
                    No previous measurements recorded. Save your first set using the form on the left.
                  </p>
                ) : (
                  <div className="mt-3 divide-y divide-[#f0edf7]">
                    {savedMeasurements.map((m, idx) => (
                      <div key={m.id || idx} className="py-2.5 text-[11px]">
                        <div className="flex justify-between text-[#96918c]">
                          <span>Record #{idx + 1}</span>
                          <span>
                            {m.created_at
                              ? new Date(m.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })
                              : 'Saved'}
                          </span>
                        </div>
                        <div className="mt-1 font-semibold text-[#171717]">
                          Bust: {m.bust || '—'}&quot; • Waist: {m.waist || '—'}&quot; • Length: {m.blouse_length || '—'}&quot;
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
