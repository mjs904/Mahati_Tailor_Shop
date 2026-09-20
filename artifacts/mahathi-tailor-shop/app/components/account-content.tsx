'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit2,
  LoaderCircle,
  LogOut,
  MapPin,
  Package,
  Ruler,
  Scissors,
  Sparkles,
  UserRound,
} from 'lucide-react';
import {
  getCurrentSession,
  getInsforgeErrorMessage,
  getInsforgeTable,
  INSFORGE_TABLES,
  isInsforgeConfigured,
  logoutUser,
  onAuthStateChange,
} from '../../lib/insforge';
import { formatPrice } from '../data/products';

type Tab = 'profile' | 'orders' | 'appointments' | 'measurements' | 'tailoring';

export default function AccountContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingLogout, setPendingLogout] = useState(false);
  const [error, setError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Tab Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [tailoringRequests, setTailoringRequests] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Editable Profile Fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');

  // Load User & Profile
  const loadUser = useCallback(async () => {
    if (!isInsforgeConfigured()) {
      setError('InsForge is not configured. Please check environment variables.');
      setLoading(false);
      return;
    }

    try {
      const result = await getCurrentSession();
      if (result.error || !result.user) {
        router.replace('/login');
        return;
      }

      setUser(result.user);

      // Load Profile from 'profiles' table
      try {
        const { data: profData } = await getInsforgeTable(INSFORGE_TABLES.profiles)
          .select()
          .eq('id', result.user.id)
          .single();

        if (profData) {
          setProfile(profData);
          setEditName(profData.name || '');
          setEditPhone(profData.phone || '');
          setEditAddress(profData.address || '');
          setEditCity(profData.city || 'Hyderabad');
          setEditState(profData.state || 'Telangana');
          setEditPincode(profData.pincode || '');
        } else {
          setEditName(result.user.profile?.name || (result.user as any)?.name || '');
        }
      } catch {
        setEditName(result.user.profile?.name || (result.user as any)?.name || '');
      }

      setLoading(false);
    } catch (err) {
      setError(getInsforgeErrorMessage(err, "We couldn't verify your session. Please try again."));
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadUser();
    const unsub = onAuthStateChange(() => {
      void loadUser();
    });
    return () => unsub?.();
  }, [loadUser]);

  // Load Tab Specific Data
  useEffect(() => {
    if (!user?.id || !isInsforgeConfigured()) return;

    const fetchTabData = async () => {
      setLoadingData(true);
      try {
        if (activeTab === 'orders') {
          const { data } = await getInsforgeTable(INSFORGE_TABLES.orders)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          setOrders(data || []);
        } else if (activeTab === 'appointments') {
          const { data } = await getInsforgeTable(INSFORGE_TABLES.appointments)
            .select()
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          setAppointments(data || []);
        } else if (activeTab === 'measurements') {
          const { data } = await getInsforgeTable(INSFORGE_TABLES.measurements)
            .select()
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          setMeasurements(data || []);
        } else if (activeTab === 'tailoring') {
          const [tailoringRes, aariRes] = await Promise.all([
            getInsforgeTable(INSFORGE_TABLES.tailoringRequests)
              .select()
              .eq('user_id', user.id)
              .order('created_at', { ascending: false }),
            getInsforgeTable(INSFORGE_TABLES.aariRequests)
              .select()
              .eq('user_id', user.id)
              .order('created_at', { ascending: false }),
          ]);
          setTailoringRequests([
            ...(tailoringRes.data || []).map((i: any) => ({ ...i, kind: 'Tailoring' })),
            ...(aariRes.data || []).map((i: any) => ({ ...i, kind: 'Aari Work' })),
          ]);
        }
      } catch (err) {
        console.warn('Tab data fetch error:', err);
      } finally {
        setLoadingData(false);
      }
    };

    void fetchTabData();
  }, [activeTab, user?.id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingProfile(true);
    setProfileSuccess(false);

    try {
      const payload = {
        id: user.id,
        email: user.email,
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        pincode: editPincode.trim(),
      };

      await getInsforgeTable(INSFORGE_TABLES.profiles).upsert(payload);

      setProfile(payload);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.warn('Profile save note:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const logout = async () => {
    setPendingLogout(true);
    try {
      await logoutUser();
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <LoaderCircle size={24} className="animate-spin text-[#4f6bff]" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e8e4df] bg-white shadow-sm">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8e4df] p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#171717] text-xl font-bold text-[#d4af37]">
            {profile?.name ? profile.name[0].toUpperCase() : 'M'}
          </span>
          <div>
            <p className="font-label text-[9px] uppercase tracking-[.18em] text-[#4f6bff]">
              Customer Account
            </p>
            <h1 className="mt-0.5 text-2xl font-extrabold text-[#171717]">
              {profile?.name || user?.email?.split('@')[0] || 'Client'}
            </h1>
            <p className="text-[12px] text-[#696663]">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          disabled={pendingLogout}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd8d1] px-3.5 py-2 text-[11px] font-bold text-[#494643] transition-colors hover:border-[#171717] hover:text-[#171717] disabled:opacity-50"
        >
          {pendingLogout ? <LoaderCircle size={14} className="animate-spin" /> : <LogOut size={14} />}
          Sign Out
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-[#e8e4df] px-6">
        {[
          { tabKey: 'profile' as Tab, label: 'Personal Details', Icon: UserRound },
          { tabKey: 'orders' as Tab, label: 'Order History', Icon: Package },
          { tabKey: 'appointments' as Tab, label: 'Appointments', Icon: CalendarDays },
          { tabKey: 'measurements' as Tab, label: 'Measurements', Icon: Ruler },
          { tabKey: 'tailoring' as Tab, label: 'Tailoring & Aari', Icon: Scissors },
        ].map(({ tabKey, label, Icon }) => {
          const isActive = activeTab === tabKey;
          return (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-[11px] font-bold transition-all ${
                isActive
                  ? 'border-[#4f6bff] text-[#4f6bff]'
                  : 'border-transparent text-[#696663] hover:text-[#171717]'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="p-6 sm:p-8">
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="max-w-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-extrabold text-[#171717]">Delivery Address & Details</h2>
              {profileSuccess && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#287335]">
                  <CheckCircle2 size={14} /> Profile updated!
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your Name"
                  className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] bg-white px-3 text-[12px] outline-none focus:border-[#4f6bff]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                  Phone (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 90000 00000"
                  className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] bg-white px-3 text-[12px] outline-none focus:border-[#4f6bff]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                  Default Delivery Address
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Flat, building, colony"
                  className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] bg-white px-3 text-[12px] outline-none focus:border-[#4f6bff]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                  City
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] bg-white px-3 text-[12px] outline-none focus:border-[#4f6bff]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                  State
                </label>
                <input
                  type="text"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] bg-white px-3 text-[12px] outline-none focus:border-[#4f6bff]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={editPincode}
                  onChange={(e) => setEditPincode(e.target.value)}
                  placeholder="500034"
                  className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] bg-white px-3 text-[12px] outline-none focus:border-[#4f6bff]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="gradient-ink mt-2 inline-flex h-10 items-center justify-center rounded-lg px-5 text-[11px] font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        )}

        {activeTab === 'orders' && (
          <div>
            {loadingData ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <LoaderCircle size={20} className="animate-spin text-[#4f6bff]" />
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d8d2ca] p-8 text-center">
                <Package size={28} className="mx-auto text-[#aaa]" />
                <h3 className="mt-3 text-[13px] font-bold text-[#171717]">No orders yet</h3>
                <p className="mt-1 text-[11px] text-[#696663]">
                  When you place an order, its real-time delivery status will appear here.
                </p>
                <Link
                  href="/shop"
                  className="gradient-ink mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[10px] font-bold text-white"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="rounded-xl border border-[#e8e4df] bg-[#faf8f5] p-4 text-[12px]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8e4df] pb-3">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-[#171717]">
                          #{ord.order_number || ord.id.slice(0, 8)}
                        </span>
                        <span className="ml-2 text-[10px] text-[#96918c]">
                          {new Date(ord.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className="rounded-full bg-[#eef8ed] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[.06em] text-[#287335]">
                        {ord.status}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between">
                      <span className="text-[#696663]">Total Amount:</span>
                      <strong className="text-[#171717]">{formatPrice(ord.total_amount || 0)}</strong>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-[#696663]">Payment:</span>
                      <span className="capitalize">{ord.payment_method} ({ord.payment_status})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            {loadingData ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <LoaderCircle size={20} className="animate-spin text-[#4f6bff]" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d8d2ca] p-8 text-center">
                <CalendarDays size={28} className="mx-auto text-[#aaa]" />
                <h3 className="mt-3 text-[13px] font-bold text-[#171717]">No booked appointments</h3>
                <p className="mt-1 text-[11px] text-[#696663]">
                  Schedule a private fitting trial or bridal consult at our Banjara Hills studio.
                </p>
                <Link
                  href="/appointments"
                  className="gradient-ink mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[10px] font-bold text-white"
                >
                  Book Appointment
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="rounded-xl border border-[#e8e4df] bg-[#faf8f5] p-4 text-[12px]"
                  >
                    <div className="flex items-center justify-between border-b border-[#e8e4df] pb-2.5">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={15} className="text-[#4f6bff]" />
                        <strong className="text-[#171717]">
                          {apt.appointment_date} at {apt.appointment_time}
                        </strong>
                      </div>
                      <span className="rounded bg-[#fff0fb] px-2 py-0.5 text-[10px] font-bold uppercase text-[#d600c7]">
                        {apt.status}
                      </span>
                    </div>
                    {apt.notes && <p className="mt-2 text-[11px] text-[#696663]">{apt.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'measurements' && (
          <div>
            {loadingData ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <LoaderCircle size={20} className="animate-spin text-[#4f6bff]" />
              </div>
            ) : measurements.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d8d2ca] p-8 text-center">
                <Ruler size={28} className="mx-auto text-[#aaa]" />
                <h3 className="mt-3 text-[13px] font-bold text-[#171717]">No saved measurements</h3>
                <p className="mt-1 text-[11px] text-[#696663]">
                  Save your bust, waist, and blouse dimensions for effortless reordering.
                </p>
                <Link
                  href="/services/tailoring"
                  className="gradient-ink mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[10px] font-bold text-white"
                >
                  Submit Measurements
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {measurements.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-[#e8e4df] bg-[#faf8f5] p-4 text-[12px]"
                  >
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <div>
                        <span className="text-[10px] text-[#96918c]">Bust:</span>
                        <strong className="block text-[#171717]">{m.bust || '—'} in</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#96918c]">Waist:</span>
                        <strong className="block text-[#171717]">{m.waist || '—'} in</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#96918c]">Shoulder:</span>
                        <strong className="block text-[#171717]">{m.shoulder || '—'} in</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#96918c]">Sleeve:</span>
                        <strong className="block text-[#171717]">{m.sleeve_length || '—'} in</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#96918c]">Length:</span>
                        <strong className="block text-[#171717]">{m.blouse_length || '—'} in</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tailoring' && (
          <div>
            {loadingData ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <LoaderCircle size={20} className="animate-spin text-[#4f6bff]" />
              </div>
            ) : tailoringRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d8d2ca] p-8 text-center">
                <Scissors size={28} className="mx-auto text-[#aaa]" />
                <h3 className="mt-3 text-[13px] font-bold text-[#171717]">No active service requests</h3>
                <p className="mt-1 text-[11px] text-[#696663]">
                  Request custom tailoring or bespoke bridal Aari handwork anytime.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Link
                    href="/services/tailoring"
                    className="gradient-ink rounded-lg px-4 py-2 text-[10px] font-bold text-white"
                  >
                    Custom Tailoring
                  </Link>
                  <Link
                    href="/services/bridal"
                    className="rounded-lg border border-[#ddd8d1] bg-white px-4 py-2 text-[10px] font-bold text-[#171717]"
                  >
                    Bridal Aari Work
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {tailoringRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-[#e8e4df] bg-[#faf8f5] p-4 text-[12px]"
                  >
                    <div className="flex items-center justify-between border-b border-[#e8e4df] pb-2.5">
                      <span className="font-bold text-[#171717]">{req.kind}: {req.service_type || 'Custom Piece'}</span>
                      <span className="rounded bg-[#eee5d7] px-2 py-0.5 text-[10px] font-bold uppercase text-[#806728]">
                        {req.status}
                      </span>
                    </div>
                    {req.notes && <p className="mt-2 text-[11px] text-[#696663]">{req.notes}</p>}
                    {req.estimated_price && (
                      <p className="mt-2 font-semibold text-[#4f6bff]">
                        Estimate: {formatPrice(req.estimated_price)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}