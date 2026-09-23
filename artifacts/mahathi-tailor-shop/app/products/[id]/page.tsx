import type { Metadata } from 'next';
import Footer from '../../components/footer';
import Header from '../../components/header';
import ProductDetailContent from '../../components/product-detail-content';
import { fetchCatalog } from '../../data/products';

export const metadata: Metadata = {
  title: 'Product | Mahathi Tailor Shop',
  description: 'View product details from the Mahathi Tailor Shop collection.',
};

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function ProductPage() {
  return (
    <main className="market-shell min-h-[100dvh]">
      <Header />
      <ProductDetailContent />
      <Footer />
    </main>
  );
}