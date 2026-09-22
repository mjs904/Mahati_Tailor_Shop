'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, LoaderCircle, Lock, MapPin, Phone } from 'lucide-react';
import Header from '../components/header';
import Footer from '../components/footer';
import AuthModal from '../components/auth-modal';
import { ensureProfileId, getCurrentSession, getInsforgeTable, INSFORGE_TABLES, isInsforgeConfigured } from '../../lib/insforge';

const TIME_SLOTS = [
  { label: '11:00 AM - 12:00 PM', time: '11:00:00' },
  { label: '12:30 PM - 01:30 PM', time: '12:30:00' },
  { label: '02:30 PM - 03:30 PM', time: '14:30:00' },
  { label: '04:00 PM - 05:00 PM', time: '16:00:00' },
  { label: '05:30 PM - 06:30 PM', time: '17:30:00' },
  { label: '06:30 PM - 07:30 PM', time: '18:30:00' },
];

export default function AppointmentsPage() {
  const [date, setDate] = useState('');
  const [slotTime, setSlotTime] = useState(TIME_SLOTS[0].time);
  const [serviceType, setServiceType] = useState('Blouse Measurement & Fitting');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookedId, setBookedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Set default min date to tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  useEffect(() => {
    setDate(minDateStr);
    if (!isInsforgeConfigured()) return;
    const checkUser = async () => {
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
    void checkUser();
  }, [minDateStr]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setShowAuthModal(true);
      setError('Please sign in or create an account to schedule an appointment.');
      return;
    }

    if (!date || !slotTime || !name || !phone) {
      setError('Please provide your date, preferred slot, name, and phone number.');
      return;
    }

    setSubmitting(true);

    try {
      if (isInsforgeConfigured()) {
        const activeProfileId = await ensureProfileId({
          id: userId,
          name,
          phone,
        });

        const selectedSlot = TIME_SLOTS.find((s) => s.time === slotTime) || TIME_SLOTS[0];
        const notesWithCustomer = `Client: ${name} (${phone}) | Service: ${serviceType} | Time: ${selectedSlot.label} | Notes: ${notes || 'None'}`;

        const { data, error: bookingErr } = await getInsforgeTable(INSFORGE_TABLES.appointments)
          .insert({
            user_id: activeProfileId,
            appointment_type: serviceType,
            appointment_date: date,
            appointment_time: slotTime,
            customer_name: name,
            customer_phone: phone,
            status: 'pending',
            notes: notesWithCustomer,
          })
          .select()
          .single();

        if (bookingErr) {
          console.warn('Booking warning:', bookingErr);
        }

        setBookedId(data?.id || `APT-${Date.now().toString(36).toUpperCase()}`);
      } else {
        setBookedId(`APT-${Date.now().toString(36).toUpperCase()}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not schedule appointment. Please try again.');
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

        {/* Header Hero */}
        <div className="gradient-ink mb-10 rounded-2xl p-8 text-white md:p-12">
          <div className="max-w-2xl">
            <span className="font-label text-[9px] uppercase tracking-[.2em] text-white/75">
              Hyderabad Studio • Fitting Trials
            </span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-.05em] sm:text-4xl">
              Book a Studio Fitting & Styling Consultation
            </h1>
            <p className="mt-3 text-[13px] leading-6 text-white/85">
              Visit our Banjara Hills workroom for personalized measurements, fabric touch-and-feel,
              and one-on-one bridal styling with our senior master cut specialists.
            </p>
          </div>
        </div>

        {bookedId ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-[#c9e6d2] bg-white p-8 text-center shadow-md">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3fbf5] text-[#287335]">
              <CheckCircle2 size={36} />
            </span>
            <span className="mt-4 inline-block font-label text-[10px] uppercase tracking-[.18em] text-[#287335]">
              Appointment Confirmed
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-[#171717]">
              We look forward to seeing you
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#696663]">
              Reference ID:{' '}
              <strong className="font-mono text-[#171717]">{bookedId.slice(0, 12)}</strong>
            </p>

            <div className="my-6 rounded-xl border border-[#e8e4df] bg-[#faf8f5] p-5 text-left text-[12px] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#96918c]">Date & Time:</span>
                <span className="font-bold text-[#171717]">{date} at {TIME_SLOTS.find(s => s.time === slotTime)?.label || slotTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#96918c]">Service:</span>
                <span className="font-semibold text-[#171717]">{serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#96918c]">Location:</span>
                <span className="text-right text-[#171717]">
                  8-2-293/82, Banjara Hills, Hyderabad
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/account"
                className="gradient-ink flex-1 rounded-xl py-3 text-[11px] font-bold text-white shadow-sm"
              >
                View in My Account
              </Link>
              <Link
                href="/shop"
                className="flex-1 rounded-xl border border-[#ddd8d1] bg-white py-3 text-[11px] font-bold text-[#171717] hover:bg-[#faf8f5]"
              >
                Browse Collection
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-2 border-b border-[#e8e4df] pb-4">
                <CalendarDays size={18} className="text-[#4f6bff]" />
                <h2 className="text-[14px] font-extrabold text-[#171717]">
                  Schedule Your Visit
                </h2>
              </div>

              {!userId && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#f5e0b8] bg-[#fffbf2] p-4 text-[#8a651a]">
                  <Lock size={18} className="mt-0.5 shrink-0 text-[#8a651a]" />
                  <div className="text-[12px] leading-5">
                    <p className="font-bold text-[#171717]">Sign in required to book appointments</p>
                    <p className="mt-0.5 text-[#735415]">
                      Please{' '}
                      <Link href="/login?redirect=/appointments" className="font-bold text-[#4f6bff] underline hover:text-[#171717]">
                        sign in
                      </Link>{' '}
                      or{' '}
                      <Link href="/register?redirect=/appointments" className="font-bold text-[#4f6bff] underline hover:text-[#171717]">
                        create an account
                      </Link>{' '}
                      to confirm your boutique fitting slot.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-[#f1c9c9] bg-[#fff5f5] p-3.5 text-[11px] text-[#a64242]">
                  {error}
                </div>
              )}

              <div className="mt-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Service Requested *
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                  >
                    <option>Blouse Measurement & Fitting</option>
                    <option>Bridal Consultation & Maggam Embroidery</option>
                    <option>Kurta Set & Trousseau Styling</option>
                    <option>Alteration & Garment Resizing Trial</option>
                    <option>Fabric & Color Matching</option>
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={minDateStr}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                      Time Slot *
                    </label>
                    <select
                      value={slotTime}
                      onChange={(e) => setSlotTime(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                    >
                      {TIME_SLOTS.map((s) => (
                        <option key={s.time} value={s.time}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 90000 00000"
                      className="mt-1.5 h-11 w-full rounded-lg border border-[#ddd8d1] bg-white px-3.5 text-[12px] outline-none focus:border-[#4f6bff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Special Fitting / Fabric Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bringing own fabric, wedding date, or specific neckline requirements"
                    className="mt-1.5 w-full rounded-lg border border-[#ddd8d1] bg-white p-3 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="gradient-ink mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" /> Scheduling Appointment…
                    </>
                  ) : (
                    'Confirm Studio Appointment'
                  )}
                </button>
              </div>
            </form>

            {/* Studio Info Sidebar */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm">
                <h3 className="text-[13px] font-extrabold text-[#171717]">Studio Information</h3>
                <div className="mt-4 space-y-3.5 text-[12px] text-[#696663]">
                  <p className="flex items-start gap-2.5">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-[#d4af37]" />
                    <span>
                      8-2-293/82, Road No. 12, Banjara Hills<br />
                      Hyderabad, Telangana 500034
                    </span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Clock3 size={16} className="shrink-0 text-[#4f6bff]" />
                    <span>Tuesday – Sunday, 11:00 AM – 07:30 PM (Mondays Closed)</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Phone size={16} className="shrink-0 text-[#4f6bff]" />
                    <span>+91 90000 1998</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e8e4df] bg-[#faf8f5] p-5 text-[11px] text-[#696663] space-y-2">
                <strong className="block font-bold text-[#171717]">What to expect:</strong>
                <p>• Private trial room with full-length 3-way studio mirrors.</p>
                <p>• Complimentary blouse padding and fabric stiffening consult.</p>
                <p>• Free parking available at the studio entrance.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign in to schedule"
        message="Please sign in or create an account to book your boutique appointment."
        redirectPath="/appointments"
      />
    </main>
  );
}
