import type { Metadata } from 'next';
import Footer from '../../components/footer';
import Header from '../../components/header';
import ProductDetailContent from '../../components/product-detail-content';
import { fetchCatalog } from '../../data/products';

export const metadata: Metadata = {
  title: 'Product | Mahathi Tailor Shop',
  description: 'View product details from the Mahathi Tailor Shop collection.',
};

export const dynamicParams = false;

export async function generateStaticParams() {
  try {
    const catalog = await fetchCatalog();
    const ids = catalog.products.map((product) => ({ id: product.id }));
    const slugs = catalog.products
      .filter((p) => p.slug && p.slug !== p.id)
      .map((p) => ({ id: p.slug as string }));
    const all = [...ids, ...slugs];
    return all.length > 0 ? all : [{ id: 'preview' }];
  } catch {
    return [{ id: 'preview' }];
  }
}

export default function ProductPage() {
  return (
    <main className="market-shell min-h-[100dvh]">
      <Header />
      <ProductDetailContent />
      <Footer />
    </main>
  );
}