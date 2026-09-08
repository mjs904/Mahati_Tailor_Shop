import { Suspense } from 'react';
import Footer from '../components/footer';
import Header from '../components/header';
import ShopContent from '../components/shop-content';

export default function ShopPage() {
  return <><Header /><Suspense fallback={<div className="market-shell min-h-[70dvh] p-10 text-center text-sm text-[#696663]">Loading the collection…</div>}><ShopContent /></Suspense><Footer /></>;
}