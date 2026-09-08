'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import {
  getCurrentSession,
  isInsforgeConfigured,
  onAuthStateChange,
} from '../../lib/insforge';

type CurrentUser = Awaited<ReturnType<typeof getCurrentSession>>['user'];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const [authUser, setAuthUser] = useState<CurrentUser>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const sync = () => {
      setCartCount(Number(window.sessionStorage.getItem('mahathi-cart-count') || 0));
      setWishCount(Number(window.localStorage.getItem('mahathi-wishlist-count') || 0));
    };
    sync();
    window.addEventListener('mahathi-cart-updated', sync);
    window.addEventListener('mahathi-wishlist-updated', sync);
    return () => {
      window.removeEventListener('mahathi-cart-updated', sync);
      window.removeEventListener('mahathi-wishlist-updated', sync);
    };
  }, []);

  useEffect(() => {
    if (!isInsforgeConfigured()) {
      setAuthChecked(true);
      return;
    }

    let mounted = true;
    const syncAuth = async () => {
      try {
        const result = await getCurrentSession();
        if (mounted) {
          setAuthUser(result.user);
          setAuthChecked(true);
        }
      } catch {
        if (mounted) {
          setAuthChecked(true);
        }
      }
    };

    void syncAuth();
    const unsubscribe = onAuthStateChange(() => {
      void syncAuth();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/shop${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`);
  };

  const navItems = [
    ['Dresses', '/shop?category=Dresses'],
    ['Sarees', '/shop?category=Sarees'],
    ['Blouses', '/shop?category=Blouses'],
    ['Bridal', '/shop?category=Bridal'],
    ['Aari Work', '/shop?category=Aari+Work'],
    ['Embroidery', '/shop?category=Embroidery'],
    ['Kids', '/shop?category=Kids'],
    ['Accessories', '/shop?category=Accessories'],
  ];

  return (
    <>
      <div className="gradient-ink px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[.13em] text-white">
        Complimentary shipping on orders over ₹1,999 <span className="mx-2 opacity-50">•</span> Hyderabad tailoring, shipped across India
      </div>
      <header className="sticky top-0 z-40 border-b border-[#e8e4df] bg-[#faf8f5]/95 backdrop-blur-md">
        <div className="market-container flex min-h-[70px] flex-wrap items-center gap-2 py-3 md:h-[70px] md:flex-nowrap md:gap-4 md:py-0">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Mahathi Tailor Shop home">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#171717] text-xs font-bold text-[#d4af37]">M</span>
            <span className="hidden leading-[1.05] sm:block">
              <strong className="block text-[14px] font-extrabold tracking-[-.04em]">mahathi</strong>
              <small className="font-label text-[8px] uppercase tracking-[.16em] text-[#696663]">tailor shop</small>
            </span>
          </Link>
          <form onSubmit={submitSearch} className="relative order-5 basis-full md:order-none md:ml-5 md:basis-auto md:max-w-[430px] md:flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#696663]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sarees, kurtas, Aari work..." className="h-11 w-full rounded-xl border border-[#ddd8d1] bg-white pl-11 pr-4 text-[12px] outline-none transition-colors placeholder:text-[#96918c] focus:border-[#4f6bff]" aria-label="Search products" />
          </form>
          <nav className="hidden flex-1 items-center justify-end gap-5 lg:flex">
            <Link href="/shop" className={`text-[11px] font-bold ${pathname === '/shop' ? 'text-[#4f6bff]' : 'text-[#494643] hover:text-[#4f6bff]'}`}>Shop</Link>
            <Link href="/#services" className="text-[11px] font-bold text-[#494643] hover:text-[#4f6bff]">Tailoring</Link>
            <Link href="/#bridal" className="text-[11px] font-bold text-[#494643] hover:text-[#4f6bff]">Bridal</Link>
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
            <Link href="/#wishlist" className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#494643] hover:bg-white" aria-label="Wishlist"><Heart size={18} strokeWidth={1.8} />{wishCount > 0 && <span className="absolute right-0.5 top-0.5 min-w-3.5 rounded-full bg-[#d600c7] px-1 text-center text-[8px] font-bold text-white">{wishCount}</span>}</Link>
            <Link href="/#cart" className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#494643] hover:bg-white" aria-label="Cart"><ShoppingBag size={18} strokeWidth={1.8} />{cartCount > 0 && <span className="absolute right-0.5 top-0.5 min-w-3.5 rounded-full bg-[#4f6bff] px-1 text-center text-[8px] font-bold text-white">{cartCount}</span>}</Link>
            <Link href={authChecked && authUser ? '/account' : '/login'} className="flex h-10 items-center justify-center gap-2 rounded-lg px-2 text-[#494643] hover:bg-white" aria-label="Account" title={authUser?.email || 'Log in'}><UserRound size={18} strokeWidth={1.8} /><span className="hidden text-[10px] font-bold xl:inline">{authUser ? 'Account' : 'Log in'}</span></Link>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg text-[#494643] hover:bg-white lg:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        <div className="border-t border-[#e8e4df] bg-white">
          <div className="market-container flex h-10 items-center gap-6 overflow-x-auto whitespace-nowrap">
            {navItems.map(([label, href]) => <Link key={label} href={href} className="shrink-0 text-[10px] font-bold text-[#696663] transition-colors hover:text-[#4f6bff]">{label}</Link>)}
            <span className="ml-auto shrink-0 font-label text-[9px] uppercase tracking-[.12em] text-[#d600c7]">New: festive edit</span>
          </div>
        </div>
        {menuOpen && <div className="border-t border-[#e8e4df] bg-white p-4 lg:hidden"><div className="market-container grid grid-cols-2 gap-1">{navItems.map(([label, href]) => <Link key={label} href={href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-[12px] font-bold text-[#494643] hover:bg-[#faf8f5]">{label}</Link>)}</div></div>}
      </header>
    </>
  );
}