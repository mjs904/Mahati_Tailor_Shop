 'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, Check, ChevronRight, Clock3, LoaderCircle, Ruler, Scissors, Sparkles, Truck, UserRound } from 'lucide-react';
import Footer from './components/footer';
import Header from './components/header';
import ProductCard from './components/product-card';
import { getInsforgeErrorMessage } from '../lib/insforge';
import { useCatalog } from './hooks/use-catalog';

export default function HomePage() {
  const { categories, products, loading, error, reload } = useCatalog();

  return (
    <main className="market-shell min-h-[100dvh]">
      <Header />
      <section className="market-container pb-6 pt-5 md:pt-6">
        <div className="relative grid min-h-[220px] overflow-hidden rounded-2xl bg-[#171717] md:grid-cols-[1.05fr_.95fr]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(18,150,243,.65),transparent_36%),linear-gradient(110deg,#1296f3,#4f6bff_45%,#8a3dff_76%,#d600c7)] opacity-95" />
          <div className="relative z-10 flex flex-col items-start justify-center px-6 py-7 text-white sm:px-9">
            <p className="font-label text-[9px] uppercase tracking-[.18em] text-white/75">Festive 2026 · Just dropped</p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3.35rem)] font-extrabold leading-[1.02] tracking-[-.06em]">Festive Collection</h1>
            <p className="mt-3 max-w-[390px] text-[12px] leading-5 text-white/80">Discover beautiful styles for every occasion, from everyday cottons to celebration-ready handwork.</p>
            <div className="mt-5 flex flex-wrap items-center gap-3"><Link href="/shop" className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-[11px] font-bold text-[#4f6bff] shadow-sm">Shop Now <ArrowRight size={14} /></Link><span className="text-[10px] font-semibold text-white/75">Ships across India</span></div>
          </div>
          <div className="relative hidden min-h-[220px] overflow-hidden md:block">
            <img src="/mahathi-atelier.jpg" alt="Festive Indian wear from the Mahathi collection" className="absolute inset-0 h-full w-full object-cover object-[58%] opacity-80 mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#8a3dff] via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="market-container pb-12" id="categories">
        <div className="mb-5 flex items-end justify-between"><div><p className="font-label text-[9px] uppercase tracking-[.18em] text-[#4f6bff]">Find your fit</p><h2 className="mt-1.5 text-2xl font-extrabold tracking-[-.05em]">Shop by category</h2></div><Link href="/shop" className="hidden items-center gap-1 text-[11px] font-bold text-[#4f6bff] sm:flex">View all <ChevronRight size={15} /></Link></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {loading || error || categories.length === 0 ? (
            <CatalogNotice
              loading={loading}
              error={error}
              emptyMessage="Categories will appear here once the collection is published."
              onRetry={() => void reload()}
            />
          ) : categories.map((category) => <Link key={category.id} href={`/shop?category=${encodeURIComponent(category.name)}`} className="lift group overflow-hidden rounded-xl bg-white"><div className="aspect-[1.08] overflow-hidden" style={{ backgroundColor: category.tone }}><img src={category.image} alt={category.name} className="product-image h-full w-full object-cover" /></div><div className="px-3 py-3"><h3 className="text-[12px] font-bold">{category.name}</h3><p className="mt-1 text-[10px] text-[#96918c]">{category.count}</p></div></Link>)}
        </div>
      </section>

      <section className="market-container pb-9">
        <div className="gradient-ink flex flex-col justify-between gap-3 rounded-xl px-5 py-3.5 text-white sm:flex-row sm:items-center"><p className="text-[12px] font-bold"><span className="mr-2 rounded bg-white/20 px-2 py-1 text-[10px] uppercase tracking-[.08em]">Offer</span> Get ₹300 off on your first order over ₹2,499</p><Link href="/shop" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.1em]">Shop offers <ArrowRight size={13} /></Link></div>
      </section>

      <section className="bg-white py-12" id="featured">
        <div className="market-container"><div className="mb-5 flex items-end justify-between"><div><p className="font-label text-[9px] uppercase tracking-[.18em] text-[#d600c7]">Most loved right now</p><h2 className="mt-1.5 text-2xl font-extrabold tracking-[-.05em]">Featured products</h2></div><Link href="/shop" className="flex items-center gap-1 text-[11px] font-bold text-[#4f6bff]">See all <ChevronRight size={15} /></Link></div><div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{loading || error || products.length === 0 ? <CatalogNotice loading={loading} error={error} emptyMessage="Featured products will appear here once the collection is published." onRetry={() => void reload()} /> : products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div></div>
      </section>

      <section className="market-container py-12" id="offers">
        <div className="mb-5"><p className="font-label text-[9px] uppercase tracking-[.18em] text-[#d600c7]">Little reasons to add to cart</p><h2 className="mt-1.5 text-2xl font-extrabold tracking-[-.05em]">Deals, with a Mahathi touch</h2></div>
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/shop?category=Dresses" className="gradient-ink flex min-h-[150px] flex-col justify-between rounded-2xl p-5 text-white"><p className="font-label text-[9px] uppercase tracking-[.16em] text-white/70">Everyday edit</p><div><p className="text-xl font-extrabold tracking-[-.04em]">Under ₹1,499</p><p className="mt-1 text-[11px] text-white/75">Easy pieces, very good days.</p></div></Link>
          <Link href="/shop?category=Bridal" className="flex min-h-[150px] flex-col justify-between rounded-2xl bg-[#eee5d7] p-5 text-[#171717]"><p className="font-label text-[9px] uppercase tracking-[.16em] text-[#806728]">Bridal booking</p><div><p className="text-xl font-extrabold tracking-[-.04em]">Complimentary consultation</p><p className="mt-1 text-[11px] text-[#696663]">For orders above ₹7,500.</p></div></Link>
          <Link href="/shop" className="flex min-h-[150px] flex-col justify-between rounded-2xl bg-[#e8e8f7] p-5 text-[#171717]"><p className="font-label text-[9px] uppercase tracking-[.16em] text-[#4f6bff]">The fresh drop</p><div><p className="text-xl font-extrabold tracking-[-.04em]">New colours, same craft</p><p className="mt-1 text-[11px] text-[#696663]">Meet the monsoon edit.</p></div></Link>
        </div>
      </section>

      <section className="bg-[#f0edf7] py-12" id="trending">
        <div className="market-container"><div className="mb-5 flex items-end justify-between"><div><p className="font-label text-[9px] uppercase tracking-[.18em] text-[#8a3dff]">Seen around the studio</p><h2 className="mt-1.5 text-2xl font-extrabold tracking-[-.05em]">Trending this week</h2></div><Link href="/shop" className="flex items-center gap-1 text-[11px] font-bold text-[#4f6bff]">Browse everything <ChevronRight size={15} /></Link></div><div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{loading || error || products.length === 0 ? <CatalogNotice loading={loading} error={error} emptyMessage="More products will appear here once the collection is published." onRetry={() => void reload()} /> : products.slice(4, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div></div>
      </section>

      <section className="market-container grid gap-5 py-12 md:grid-cols-2" id="bridal">
        <div className="relative min-h-[320px] overflow-hidden rounded-2xl bg-[#302333]"><img src="/aari-blouse.jpg" alt="Gold Aari embroidery detail" className="absolute inset-0 h-full w-full object-cover opacity-75" /><div className="absolute inset-0 bg-gradient-to-t from-[#171717]/90 to-transparent" /><div className="absolute bottom-6 left-6 text-white"><p className="font-label text-[9px] uppercase tracking-[.18em] text-[#d4af37]">Bridal collection</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-.06em]">For the day<br />you&apos;ll replay.</h2><Link href="/shop?category=Bridal" className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold text-white">Explore bridal <ArrowRight size={14} /></Link></div></div>
        <div className="flex flex-col justify-center rounded-2xl bg-[#eee5d7] p-7 sm:p-10"><p className="font-label text-[9px] uppercase tracking-[.18em] text-[#806728]">Handwork, up close</p><h2 className="mt-3 max-w-[390px] text-3xl font-extrabold leading-[1.08] tracking-[-.06em]">Aari work that holds the light.</h2><p className="mt-4 max-w-[420px] text-[13px] leading-6 text-[#696663]">Each motif is drawn, stitched, and finished by hand in our Hyderabad workroom. Choose a ready piece or bring us your own idea.</p><Link href="/services/bridal" className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-[#171717] px-4 py-3 text-[11px] font-bold text-white">Consult Bridal Stylist <ArrowRight size={14} /></Link></div>
      </section>

      <section className="bg-white py-12" id="services">
        <div className="market-container"><div className="mb-6 max-w-[650px]"><p className="font-label text-[9px] uppercase tracking-[.18em] text-[#4f6bff]">More than a checkout</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-.06em]">Your piece, your measurements.</h2><p className="mt-3 text-[13px] leading-6 text-[#696663]">From a quick alteration to a fully made-to-measure bridal blouse, our stylists help you land the fit before the fabric hits the table.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [Ruler, 'Custom measurements', 'A fitting that starts with how you move.', '/measurements'],
              [Scissors, 'Alterations', 'Small changes, big difference.', '/services/tailoring'],
              [Sparkles, 'Aari & bridal', 'Handwork designed around your story.', '/services/bridal'],
            ].map(([Icon, title, text, href]) => {
              const ServiceIcon = Icon as typeof Ruler;
              return (
                <div key={title as string} className="rounded-xl border border-[#e8e4df] bg-[#faf8f5] p-5">
                  <ServiceIcon size={19} className="text-[#4f6bff]" />
                  <h3 className="mt-4 text-[13px] font-bold">{title as string}</h3>
                  <p className="mt-2 text-[11px] leading-5 text-[#77736f]">{text as string}</p>
                  <Link href={href as string} className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[#4f6bff]">
                    Start request <ArrowRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="market-container py-12" id="gallery">
        <div className="mb-5 flex items-end justify-between"><div><p className="font-label text-[9px] uppercase tracking-[.18em] text-[#d600c7]">From our workroom</p><h2 className="mt-1.5 text-2xl font-extrabold tracking-[-.05em]">A little Mahathi world</h2></div><span className="font-label text-[9px] uppercase tracking-[.12em] text-[#96918c]">@mahathitailors</span></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><img src="/mahathi-atelier.jpg" alt="Mahathi atelier" className="aspect-square w-full rounded-xl object-cover" /><img src="/aari-blouse.jpg" alt="Aari embroidered blouse" className="aspect-square w-full rounded-xl object-cover" /><img src="/organza-dupatta.jpg" alt="Organza dupatta detail" className="aspect-square w-full rounded-xl object-cover" /><img src="/kurta-set.jpg" alt="Printed kurta set" className="aspect-square w-full rounded-xl object-cover" /></div>
      </section>

      <section id="appointment" className="market-container pb-14"><div className="gradient-ink flex flex-col justify-between gap-6 rounded-2xl p-7 text-white sm:flex-row sm:items-center sm:p-9"><div><p className="font-label text-[9px] uppercase tracking-[.18em] text-white/70">In Hyderabad? Come by.</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-.05em]">Let&apos;s find your right fit.</h2><p className="mt-2 text-[12px] text-white/75">Appointments available Tuesday–Sunday, 11am–7pm.</p></div><Link href="/appointments" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 text-[11px] font-bold text-[#4f6bff]"><CalendarDays size={15} /> Book an appointment</Link></div></section>


      <div className="border-y border-[#e8e4df] bg-white"><div className="market-container grid grid-cols-2 gap-4 py-5 sm:grid-cols-4"><span className="flex items-center gap-2 text-[10px] font-bold text-[#696663]"><Truck size={16} className="text-[#4f6bff]" /> Ships across India</span><span className="flex items-center gap-2 text-[10px] font-bold text-[#696663]"><Check size={16} className="text-[#4f6bff]" /> Quality checked</span><span className="flex items-center gap-2 text-[10px] font-bold text-[#696663]"><Clock3 size={16} className="text-[#4f6bff]" /> 7-day easy returns</span><span className="flex items-center gap-2 text-[10px] font-bold text-[#696663]"><UserRound size={16} className="text-[#4f6bff]" /> Human support</span></div></div>
      <Footer />
    </main>
  );
}

function CatalogNotice({
  loading,
  error,
  emptyMessage,
  onRetry,
}: {
  loading: boolean;
  error: unknown | null;
  emptyMessage: string;
  onRetry: () => void;
}) {
  return (
    <div className="col-span-full flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d8d2ca] bg-white px-5 text-center">
      {loading ? (
        <LoaderCircle size={18} className="animate-spin text-[#4f6bff]" />
      ) : (
        <p className="max-w-[310px] text-[11px] leading-5 text-[#77736f]">
          {error
            ? getInsforgeErrorMessage(
                error,
                'We could not load the latest collection right now.',
              )
            : emptyMessage}
        </p>
      )}
      {Boolean(error) && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-[#171717] px-3 py-2 text-[10px] font-bold text-white"
        >
          Try again
        </button>
      )}
    </div>
  );
}