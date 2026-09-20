'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  FolderTree,
  LoaderCircle,
  Lock,
  Package,
  Plus,
  Ruler,
  Scissors,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';
import Header from '../components/header';
import Footer from '../components/footer';
import {
  getCurrentSession,
  getInsforgeErrorMessage,
  getInsforgeTable,
  INSFORGE_TABLES,
  isInsforgeConfigured,
  loginUser,
  logoutUser,
} from '../../lib/insforge';
import { formatPrice } from '../data/products';

type AdminTab = 'products' | 'categories' | 'orders' | 'appointments' | 'requests' | 'customers';

const DEFAULT_ADMIN_PIN = '1998';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [tab, setTab] = useState<AdminTab>('products');
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Data
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Product Form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdOrigPrice, setNewProdOrigPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdStock, setNewProdStock] = useState('In stock');
  const [newProdImage, setNewProdImage] = useState('/saree-plum.jpg');
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Category Form
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatImage, setNewCatImage] = useState('/mahathi-atelier.jpg');
  const [creatingCat, setCreatingCat] = useState(false);

  // Check active backend session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getCurrentSession();
        if (session.user) {
          setAdminUser(session.user);
          setAdminEmail(session.user.email || '');
        }
      } catch {
        // ignore
      }
      if (sessionStorage.getItem('mahathi_admin_auth') === 'true') {
        setIsAuthenticated(true);
      }
    };
    void checkSession();
  }, []);

  const handleAdminAuth = async (e: FormEvent) => {
    e.preventDefault();
    setPinError('');

    const expectedPin = process.env.NEXT_PUBLIC_ADMIN_PIN || DEFAULT_ADMIN_PIN;
    if (pin.trim() !== expectedPin) {
      setPinError('Invalid Admin Security Key. Please enter PIN 1998.');
      return;
    }

    // If email and password are provided, attempt InsForge background login
    if (adminEmail && adminPassword) {
      setAuthSubmitting(true);
      try {
        const result = await loginUser({
          email: adminEmail.trim().toLowerCase(),
          password: adminPassword,
        });

        if (result.data?.user) {
          setAdminUser(result.data.user);
        }
      } catch (err: any) {
        console.warn('Optional admin user login note:', err);
      } finally {
        setAuthSubmitting(false);
      }
    }

    setIsAuthenticated(true);
    sessionStorage.setItem('mahathi_admin_auth', 'true');
  };

  const handleLockAdmin = async () => {
    sessionStorage.removeItem('mahathi_admin_auth');
    setIsAuthenticated(false);
    setPin('');
    try {
      await logoutUser();
      setAdminUser(null);
    } catch {
      // ignore
    }
  };

  // Fetch data on tab change
  const refreshData = useCallback(async () => {
    if (!isInsforgeConfigured() || !isAuthenticated) return;
    setLoading(true);

    try {
      if (tab === 'products') {
        const [prodRes, catRes] = await Promise.all([
          getInsforgeTable(INSFORGE_TABLES.products).select().order('created_at', { ascending: false }),
          getInsforgeTable(INSFORGE_TABLES.categories).select(),
        ]);
        setProducts(prodRes.data || []);
        setCategories(catRes.data || []);
        if (catRes.data && catRes.data.length > 0 && !newProdCategory) {
          setNewProdCategory(catRes.data[0].id);
        }
      } else if (tab === 'categories') {
        const { data } = await getInsforgeTable(INSFORGE_TABLES.categories)
          .select()
          .order('created_at', { ascending: false });
        setCategories(data || []);
      } else if (tab === 'orders') {
        const { data: ordData } = await getInsforgeTable(INSFORGE_TABLES.orders)
          .select('*')
          .order('created_at', { ascending: false });
        if (ordData && ordData.length > 0) {
          try {
            const { data: itemsData } = await getInsforgeTable(INSFORGE_TABLES.orderItems).select('*');
            setOrders(
              (ordData || []).map((o: any) => ({
                ...o,
                order_items: (itemsData || []).filter((it: any) => it.order_id === o.id),
              }))
            );
          } catch {
            setOrders(ordData || []);
          }
        } else {
          setOrders([]);
        }
      } else if (tab === 'appointments') {
        const { data } = await getInsforgeTable(INSFORGE_TABLES.appointments)
          .select()
          .order('created_at', { ascending: false });
        setAppointments(data || []);
      } else if (tab === 'requests') {
        const [tRes, aRes] = await Promise.all([
          getInsforgeTable(INSFORGE_TABLES.tailoringRequests).select().order('created_at', { ascending: false }),
          getInsforgeTable(INSFORGE_TABLES.aariRequests).select().order('created_at', { ascending: false }),
        ]);
        setRequests([
          ...(tRes.data || []).map((x: any) => ({ ...x, typeName: 'Tailoring', table: INSFORGE_TABLES.tailoringRequests })),
          ...(aRes.data || []).map((x: any) => ({ ...x, typeName: 'Aari Work', table: INSFORGE_TABLES.aariRequests })),
        ]);
      } else if (tab === 'customers') {
        const [profRes, measRes] = await Promise.all([
          getInsforgeTable(INSFORGE_TABLES.profiles).select().order('created_at', { ascending: false }),
          getInsforgeTable(INSFORGE_TABLES.measurements).select().order('created_at', { ascending: false }),
        ]);
        setCustomers((profRes.data || []).map((p: any) => ({
          ...p,
          measurements: (measRes.data || []).filter((m: any) => m.user_id === p.id),
        })));
      }
    } catch (err) {
      console.warn('Admin load note:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, isAuthenticated, newProdCategory]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const notifySuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Add Product
  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;
    setCreatingProduct(true);

    try {
      const slug = newProdName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        name: newProdName.trim(),
        slug,
        description: newProdDesc.trim(),
        category_id: newProdCategory || null,
        price: parseFloat(newProdPrice),
        original_price: newProdOrigPrice ? parseFloat(newProdOrigPrice) : null,
        stock: newProdStock,
        image_url: newProdImage,
        rating: 4.9,
        is_active: true,
        is_featured: true,
      };

      await getInsforgeTable(INSFORGE_TABLES.products).insert(payload);

      notifySuccess(`Product "${newProdName}" added successfully!`);
      setNewProdName('');
      setNewProdPrice('');
      setNewProdOrigPrice('');
      setNewProdDesc('');
      setShowAddProduct(false);
      void refreshData();
    } catch (err: any) {
      alert(`Could not add product: ${err.message}`);
    } finally {
      setCreatingProduct(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await getInsforgeTable(INSFORGE_TABLES.products).delete().eq('id', id);
      notifySuccess(`Deleted product "${name}"`);
      void refreshData();
    } catch (err: any) {
      alert(`Could not delete: ${err.message}`);
    }
  };

  // Add Category
  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    setCreatingCat(true);

    try {
      const slug = (newCatSlug || newCatName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        name: newCatName.trim(),
        slug,
        description: newCatDesc.trim(),
        image_url: newCatImage,
        is_active: true,
      };

      await getInsforgeTable(INSFORGE_TABLES.categories).insert(payload);

      notifySuccess(`Category "${newCatName}" added!`);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDesc('');
      setShowAddCat(false);
      void refreshData();
    } catch (err: any) {
      alert(`Could not add category: ${err.message}`);
    } finally {
      setCreatingCat(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      await getInsforgeTable(INSFORGE_TABLES.categories).delete().eq('id', id);
      notifySuccess(`Deleted category "${name}"`);
      void refreshData();
    } catch (err: any) {
      alert(`Could not delete: ${err.message}`);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await getInsforgeTable(INSFORGE_TABLES.orders).update({ status }).eq('id', id);
      notifySuccess(`Order updated to "${status}"`);
      void refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update Appointment Status
  const handleUpdateAppointmentStatus = async (id: string, status: string) => {
    try {
      await getInsforgeTable(INSFORGE_TABLES.appointments).update({ status }).eq('id', id);
      notifySuccess(`Appointment status set to "${status}"`);
      void refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update Request Status
  const handleUpdateRequestStatus = async (table: string, id: string, status: string) => {
    try {
      await getInsforgeTable(table as any).update({ status }).eq('id', id);
      notifySuccess(`Request status updated`);
      void refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="market-shell min-h-[100dvh]">
        <Header />
        <div className="market-container flex min-h-[520px] items-center justify-center py-16">
          <form
            onSubmit={handleAdminAuth}
            className="w-full max-w-md rounded-2xl border border-[#e8e4df] bg-white p-8 text-center shadow-lg"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#171717] text-[#d4af37]">
              <Lock size={24} />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-[#171717]">Mahathi Atelier Admin</h1>
            <p className="mt-1 text-[11px] text-[#696663]">
              Enter your Studio Security PIN to access the management console.
            </p>

            <div className="mt-3 rounded-lg border border-[#e3d8b8] bg-[#fdfaf2] p-2.5 text-[11px] text-[#8a6e1a]">
              Master Access PIN: <strong className="tracking-widest">1998</strong>
            </div>

            {pinError && (
              <div className="mt-4 rounded-lg border border-[#f1c9c9] bg-[#fff5f5] p-3 text-[11px] font-bold text-[#a64242]">
                {pinError}
              </div>
            )}

            <div className="mt-5 text-left">
              <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                Studio Security PIN *
              </label>
              <input
                type="password"
                required
                autoFocus
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1998"
                className="mt-1 h-12 w-full rounded-xl border border-[#ddd8d1] bg-white text-center text-2xl font-bold tracking-[.4em] outline-none focus:border-[#4f6bff]"
              />
            </div>

            <details className="mt-4 text-left text-[11px] text-[#696663]">
              <summary className="cursor-pointer font-medium hover:text-[#171717]">
                Connect InsForge Admin Account (Optional)
              </summary>
              <div className="mt-3 space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@mahathitailor.in"
                    className="mt-1 h-9 w-full rounded-lg border border-[#ddd8d1] bg-white px-3 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#696663]">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 h-9 w-full rounded-lg border border-[#ddd8d1] bg-white px-3 text-[12px] outline-none focus:border-[#4f6bff]"
                  />
                </div>
              </div>
            </details>

            <button
              type="submit"
              disabled={authSubmitting}
              className="gradient-ink mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50"
            >
              {authSubmitting ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" /> Verifying Access…
                </>
              ) : (
                'Unlock Atelier Dashboard'
              )}
            </button>
            <p className="mt-3 text-[10px] text-[#96918c]">
              Protected with Studio Security Key & InsForge Identity
            </p>
          </form>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="market-shell min-h-[100dvh]">
      <Header />
      <div className="market-container pb-20 pt-8">
        {/* Header Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#e8e4df] pb-4">
          <div>
            <span className="font-label text-[9px] uppercase tracking-[.18em] text-[#d600c7]">
              Management Console
            </span>
            <h1 className="mt-0.5 text-3xl font-extrabold text-[#171717]">Boutique Operations</h1>
          </div>
          <div className="flex items-center gap-3">
            {actionSuccess && (
              <span className="flex items-center gap-1.5 rounded-lg bg-[#eef8ed] px-3 py-1.5 text-[11px] font-bold text-[#287335]">
                <CheckCircle2 size={15} /> {actionSuccess}
              </span>
            )}
            <button
              type="button"
              onClick={handleLockAdmin}
              className="rounded-lg border border-[#ddd8d1] bg-white px-3 py-1.5 text-[11px] font-bold text-[#696663] hover:text-[#171717]"
            >
              Lock Admin
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex overflow-x-auto border-b border-[#e8e4df] pb-1 gap-2">
          {[
            ['products', 'Products', Package, products.length],
            ['categories', 'Categories', FolderTree, categories.length],
            ['orders', 'Orders', Tag, orders.length],
            ['appointments', 'Appointments', CalendarDays, appointments.length],
            ['requests', 'Tailoring & Aari', Scissors, requests.length],
            ['customers', 'Customer Profiles', Users, customers.length],
          ].map(([key, label, Icon, count]) => {
            const TabIcon = Icon as typeof Package;
            const active = tab === key;
            return (
              <button
                key={key as string}
                type="button"
                onClick={() => setTab(key as AdminTab)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-bold transition-all ${
                  active
                    ? 'bg-[#171717] text-white shadow-sm'
                    : 'bg-white text-[#696663] border border-[#e8e4df] hover:border-[#171717]'
                }`}
              >
                <TabIcon size={14} />
                <span>{label as string}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[9px] ${active ? 'bg-white/20 text-white' : 'bg-[#faf8f5] text-[#96918c]'}`}>
                  {count as number}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Section */}
        <div className="mt-6">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <LoaderCircle size={24} className="animate-spin text-[#4f6bff]" />
            </div>
          ) : (
            <>
              {/* TAB 1: PRODUCTS */}
              {tab === 'products' && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-[14px] font-extrabold text-[#171717]">Catalogue Products</h2>
                    <button
                      type="button"
                      onClick={() => setShowAddProduct((v) => !v)}
                      className="gradient-ink inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-bold text-white shadow-sm"
                    >
                      <Plus size={14} /> {showAddProduct ? 'Close Form' : 'Add New Piece'}
                    </button>
                  </div>

                  {showAddProduct && (
                    <form onSubmit={handleAddProduct} className="mb-6 rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm">
                      <h3 className="text-[13px] font-bold text-[#171717]">Add Product to InsForge Database</h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-[#696663]">Product Name *</label>
                          <input
                            type="text"
                            required
                            value={newProdName}
                            onChange={(e) => setNewProdName(e.target.value)}
                            placeholder="e.g. Royal Plum Kanjeevaram Saree"
                            className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] px-3 text-[12px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#696663]">Category</label>
                          <select
                            value={newProdCategory}
                            onChange={(e) => setNewProdCategory(e.target.value)}
                            className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] px-3 text-[12px]"
                          >
                            <option value="">Uncategorized</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#696663]">Price (₹) *</label>
                          <input
                            type="number"
                            required
                            value={newProdPrice}
                            onChange={(e) => setNewProdPrice(e.target.value)}
                            placeholder="4500"
                            className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] px-3 text-[12px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#696663]">Original Price (₹)</label>
                          <input
                            type="number"
                            value={newProdOrigPrice}
                            onChange={(e) => setNewProdOrigPrice(e.target.value)}
                            placeholder="5900"
                            className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] px-3 text-[12px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#696663]">Stock Status</label>
                          <select
                            value={newProdStock}
                            onChange={(e) => setNewProdStock(e.target.value)}
                            className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] px-3 text-[12px]"
                          >
                            <option>In stock</option>
                            <option>Only 2 left</option>
                            <option>Made to order</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-[#696663]">Image Asset Path / URL</label>
                          <input
                            type="text"
                            value={newProdImage}
                            onChange={(e) => setNewProdImage(e.target.value)}
                            placeholder="/saree-plum.jpg or https://..."
                            className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] px-3 text-[12px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#696663]">Preset Artwork</label>
                          <div className="mt-1 flex gap-1">
                            {['/saree-plum.jpg', '/aari-blouse.jpg', '/kurta-set.jpg', '/organza-dupatta.jpg'].map((img) => (
                              <button
                                key={img}
                                type="button"
                                onClick={() => setNewProdImage(img)}
                                className={`h-10 w-10 overflow-hidden rounded border ${newProdImage === img ? 'ring-2 ring-[#4f6bff]' : ''}`}
                              >
                                <img src={img} alt="" className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold uppercase text-[#696663]">Description</label>
                          <textarea
                            rows={2}
                            value={newProdDesc}
                            onChange={(e) => setNewProdDesc(e.target.value)}
                            placeholder="Fine handloom silk with gold zari border..."
                            className="mt-1 w-full rounded-lg border border-[#ddd8d1] p-2 text-[12px]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={creatingProduct}
                        className="gradient-ink mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[11px] font-bold text-white shadow-sm disabled:opacity-50"
                      >
                        {creatingProduct ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}
                        Save Product to InsForge
                      </button>
                    </form>
                  )}

                  {products.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d8d2ca] bg-white p-8 text-center text-[12px] text-[#696663]">
                      No products in InsForge database yet. Click <strong>"Add New Piece"</strong> above to publish your first item!
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-[#e8e4df] bg-white shadow-sm">
                      <table className="w-full text-left text-[12px]">
                        <thead className="border-b border-[#e8e4df] bg-[#faf8f5] font-bold text-[#696663]">
                          <tr>
                            <th className="p-3.5">Piece</th>
                            <th className="p-3.5">Category</th>
                            <th className="p-3.5">Price</th>
                            <th className="p-3.5">Stock</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e8e4df]">
                          {products.map((p) => {
                            const cat = categories.find((c) => c.id === p.category_id);
                            return (
                              <tr key={p.id} className="hover:bg-[#faf8f5]">
                                <td className="p-3.5">
                                  <div className="flex items-center gap-3">
                                    <img src={p.image_url || '/mahathi-atelier.jpg'} alt="" className="h-10 w-10 rounded-lg object-cover" />
                                    <div>
                                      <Link href={`/products/${p.id}`} className="font-bold text-[#171717] hover:text-[#4f6bff]">
                                        {p.name}
                                      </Link>
                                      <span className="block font-mono text-[9px] text-[#96918c]">ID: {p.id.slice(0, 8)}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5 text-[#696663]">{cat?.name || '—'}</td>
                                <td className="p-3.5 font-extrabold text-[#171717]">{formatPrice(p.price)}</td>
                                <td className="p-3.5">
                                  <span className="rounded bg-[#eef8ed] px-2 py-0.5 text-[10px] font-semibold text-[#287335]">
                                    {p.stock || 'In stock'}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(p.id, p.name)}
                                    className="p-1 text-[#aaa] hover:text-[#d600c7]"
                                    title="Delete product"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CATEGORIES */}
              {tab === 'categories' && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-[14px] font-extrabold text-[#171717]">Store Categories</h2>
                    <button
                      type="button"
                      onClick={() => setShowAddCat((v) => !v)}
                      className="gradient-ink inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-bold text-white shadow-sm"
                    >
                      <Plus size={14} /> {showAddCat ? 'Close' : 'Add Category'}
                    </button>
                  </div>

                  {showAddCat && (
                    <form onSubmit={handleAddCategory} className="mb-6 rounded-2xl border border-[#e8e4df] bg-white p-6 shadow-sm">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#696663]">Category Name *</label>
                          <input
                            type="text"
                            required
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="e.g. Sarees"
                            className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] px-3 text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#696663]">Slug (URL handle)</label>
                          <input
                            type="text"
                            value={newCatSlug}
                            onChange={(e) => setNewCatSlug(e.target.value)}
                            placeholder="e.g. sarees"
                            className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] px-3 text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#696663]">Image URL / Path</label>
                          <input
                            type="text"
                            value={newCatImage}
                            onChange={(e) => setNewCatImage(e.target.value)}
                            className="mt-1 h-10 w-full rounded-lg border border-[#ddd8d1] px-3 text-[12px]"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={creatingCat}
                        className="gradient-ink mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2 text-[11px] font-bold text-white"
                      >
                        {creatingCat ? 'Saving...' : 'Save Category'}
                      </button>
                    </form>
                  )}

                  {categories.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d8d2ca] bg-white p-8 text-center text-[12px] text-[#696663]">
                      No categories yet. Click "Add Category" to set up your store navigation.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {categories.map((c) => (
                        <div key={c.id} className="flex items-center justify-between rounded-xl border border-[#e8e4df] bg-white p-4">
                          <div className="flex items-center gap-3">
                            <img src={c.image_url || '/mahathi-atelier.jpg'} alt="" className="h-11 w-11 rounded-lg object-cover" />
                            <div>
                              <strong className="block text-[13px] font-bold text-[#171717]">{c.name}</strong>
                              <span className="font-mono text-[9px] text-[#96918c]">{c.slug || c.id.slice(0, 8)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c.id, c.name)}
                            className="text-[#aaa] hover:text-[#d600c7]"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ORDERS */}
              {tab === 'orders' && (
                <div>
                  <h2 className="mb-4 text-[14px] font-extrabold text-[#171717]">Customer Orders</h2>
                  {orders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d8d2ca] bg-white p-8 text-center text-[12px] text-[#696663]">
                      No orders recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((o) => (
                        <div key={o.id} className="rounded-2xl border border-[#e8e4df] bg-white p-5 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e4df] pb-3">
                            <div>
                              <strong className="font-mono text-[13px] text-[#171717]">#{o.order_number || o.id.slice(0, 8)}</strong>
                              <span className="ml-3 text-[11px] text-[#96918c]">
                                {new Date(o.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-[#696663]">Status:</span>
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className="h-8 rounded-lg border border-[#ddd8d1] bg-[#faf8f5] px-2 text-[11px] font-bold"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="in_stitching">In Stitching</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-4 sm:grid-cols-3 text-[11px]">
                            <div>
                              <span className="text-[#96918c]">Client Details:</span>
                              <p className="font-bold text-[#171717]">{o.shipping_name || 'Guest'}</p>
                              <p className="text-[#696663]">{o.shipping_phone}</p>
                              <p className="text-[#696663]">{o.shipping_address}, {o.shipping_city} {o.shipping_pincode}</p>
                            </div>
                            <div>
                              <span className="text-[#96918c]">Payment & Total:</span>
                              <p className="text-base font-extrabold text-[#171717]">{formatPrice(o.total_amount || 0)}</p>
                              <p className="capitalize text-[#696663]">{o.payment_method} ({o.payment_status})</p>
                            </div>
                            <div>
                              <span className="text-[#96918c]">Order Items:</span>
                              {o.order_items && o.order_items.length > 0 ? (
                                <ul className="mt-1 space-y-1">
                                  {o.order_items.map((item: any) => (
                                    <li key={item.id} className="text-[#171717]">
                                      • {item.product_name} × {item.quantity} ({formatPrice(item.price)})
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[#96918c]">—</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: APPOINTMENTS */}
              {tab === 'appointments' && (
                <div>
                  <h2 className="mb-4 text-[14px] font-extrabold text-[#171717]">Studio Bookings</h2>
                  {appointments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d8d2ca] bg-white p-8 text-center text-[12px] text-[#696663]">
                      No appointments scheduled yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map((a) => (
                        <div key={a.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e8e4df] bg-white p-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <CalendarDays size={16} className="text-[#4f6bff]" />
                              <strong className="text-[13px] text-[#171717]">
                                {a.appointment_date} at {a.appointment_time}
                              </strong>
                            </div>
                            <p className="mt-1 text-[11px] text-[#696663]">{a.notes}</p>
                          </div>
                          <select
                            value={a.status}
                            onChange={(e) => handleUpdateAppointmentStatus(a.id, e.target.value)}
                            className="h-8 rounded-lg border border-[#ddd8d1] bg-[#faf8f5] px-2 text-[11px] font-bold"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: TAILORING & AARI REQUESTS */}
              {tab === 'requests' && (
                <div>
                  <h2 className="mb-4 text-[14px] font-extrabold text-[#171717]">Tailoring & Bridal Requests</h2>
                  {requests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d8d2ca] bg-white p-8 text-center text-[12px] text-[#696663]">
                      No custom requests submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((r) => (
                        <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e8e4df] bg-white p-4">
                          <div>
                            <span className="rounded bg-[#eee5d7] px-2 py-0.5 text-[9px] font-bold uppercase text-[#806728]">
                              {r.typeName}
                            </span>
                            <strong className="ml-2 text-[12px] text-[#171717]">{r.service_type || 'Custom Piece'}</strong>
                            <p className="mt-1 text-[11px] text-[#696663]">{r.notes}</p>
                            {r.estimated_price && (
                              <span className="mt-1 inline-block font-mono text-[10px] font-bold text-[#4f6bff]">
                                Estimate: {formatPrice(r.estimated_price)}
                              </span>
                            )}
                          </div>
                          <select
                            value={r.status}
                            onChange={(e) => handleUpdateRequestStatus(r.table, r.id, e.target.value)}
                            className="h-8 rounded-lg border border-[#ddd8d1] bg-[#faf8f5] px-2 text-[11px] font-bold"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="in_production">In Production</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: CUSTOMER PROFILES */}
              {tab === 'customers' && (
                <div>
                  <h2 className="mb-4 text-[14px] font-extrabold text-[#171717]">Customer Profiles & Measurements</h2>
                  {customers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d8d2ca] bg-white p-8 text-center text-[12px] text-[#696663]">
                      No registered profiles yet.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {customers.map((c) => (
                        <div key={c.id} className="rounded-2xl border border-[#e8e4df] bg-white p-5 shadow-sm text-[12px]">
                          <div className="flex items-center gap-3 border-b border-[#e8e4df] pb-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#171717] font-bold text-[#d4af37]">
                              {c.name ? c.name[0].toUpperCase() : 'U'}
                            </span>
                            <div>
                              <strong className="block text-[13px] text-[#171717]">{c.name || 'Unnamed Client'}</strong>
                              <span className="text-[11px] text-[#696663]">{c.email}</span>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1 text-[#696663]">
                            <p>Phone: <span className="font-semibold text-[#171717]">{c.phone || '—'}</span></p>
                            <p>Address: <span className="text-[#171717]">{c.address ? `${c.address}, ${c.city} ${c.pincode}` : '—'}</span></p>
                          </div>
                          {c.measurements && c.measurements.length > 0 && (
                            <div className="mt-3 rounded-lg bg-[#faf8f5] p-3 text-[10px]">
                              <strong className="block text-[#171717]">Saved Measurements:</strong>
                              <div className="mt-1 flex flex-wrap gap-2 text-[#696663]">
                                <span>Bust: {c.measurements[0].bust || '—'}"</span>
                                <span>Waist: {c.measurements[0].waist || '—'}"</span>
                                <span>Shoulder: {c.measurements[0].shoulder || '—'}"</span>
                                <span>Sleeve: {c.measurements[0].sleeve_length || '—'}"</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
