'use client';

import {
  ChevronDown,
  Filter,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from './product-card';
import { getInsforgeErrorMessage } from '../../lib/insforge';
import { useCatalog } from '../hooks/use-catalog';

export default function ShopContent() {
  const params = useSearchParams();
  const { categories, products, loading, error, reload } = useCatalog();
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || 'All products');
  const [price, setPrice] = useState('Any price');
  const [size, setSize] = useState('All sizes');
  const [availability, setAvailability] = useState('All availability');
  const [sort, setSort] = useState('Recommended');
  const [mobileFilters, setMobileFilters] = useState(false);

  const result = useMemo(() => {
    const lowered = query.toLowerCase().trim();
    const filtered = products.filter((product) => {
      const matchesText =
        !lowered ||
        `${product.name} ${product.description} ${product.category}`
          .toLowerCase()
          .includes(lowered);
      const matchesCategory =
        category === 'All products' || product.category === category;
      const matchesSize = size === 'All sizes' || product.sizes.includes(size);
      const matchesAvailability =
        availability === 'All availability' ||
        (availability === 'Ready to ship'
          ? product.stock === 'In stock' || product.stock.includes('Only')
          : product.stock === 'Made to order');
      const matchesPrice =
        price === 'Any price' ||
        (price === 'Under ₹1,500'
          ? product.price < 1500
          : price === '₹1,500–₹3,000'
            ? product.price >= 1500 && product.price <= 3000
            : product.price > 3000);
      return (
        matchesText &&
        matchesCategory &&
        matchesSize &&
        matchesAvailability &&
        matchesPrice
      );
    });

    if (sort === 'Price: low to high') {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    if (sort === 'Price: high to low') {
      return [...filtered].sort((a, b) => b.price - a.price);
    }
    if (sort === 'Rating') {
      return [...filtered].sort((a, b) => b.rating - a.rating);
    }
    return filtered;
  }, [availability, category, price, products, query, size, sort]);

  const clearFilters = () => {
    setCategory('All products');
    setPrice('Any price');
    setSize('All sizes');
    setAvailability('All availability');
    setQuery('');
    setSort('Recommended');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={mobile ? 'w-full' : 'hidden w-[210px] shrink-0 lg:block'}>
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-extrabold">Filters</h2>
        <button
          type="button"
          onClick={clearFilters}
          className="text-[10px] font-bold text-[#4f6bff]"
        >
          Clear all
        </button>
      </div>
      <div className="mt-5 space-y-6">
        <FilterGroup title="Categories">
          <label className="flex cursor-pointer items-center justify-between py-1.5 text-[11px] font-semibold">
            <span className="flex items-center gap-2">
              <input
                checked={category === 'All products'}
                onChange={() => setCategory('All products')}
                type="radio"
                name="category"
                className="accent-[#4f6bff]"
              />{' '}
              All products
            </span>
            <span className="text-[#aaa]">{products.length}</span>
          </label>
          {categories.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center justify-between py-1.5 text-[11px] font-semibold"
            >
              <span className="flex items-center gap-2">
                <input
                  checked={category === item.name}
                  onChange={() => setCategory(item.name)}
                  type="radio"
                  name="category"
                  className="accent-[#4f6bff]"
                />{' '}
                {item.name}
              </span>
              <span className="text-[#aaa]">{item.count.split(' ')[0]}</span>
            </label>
          ))}
        </FilterGroup>
        <FilterGroup title="Price">
          {[
            'Any price',
            'Under ₹1,500',
            '₹1,500–₹3,000',
            'Above ₹3,000',
          ].map((item) => (
            <label
              key={item}
              className="flex cursor-pointer items-center gap-2 py-1.5 text-[11px] font-semibold"
            >
              <input
                checked={price === item}
                onChange={() => setPrice(item)}
                type="radio"
                name="price"
                className="accent-[#4f6bff]"
              />{' '}
              {item}
            </label>
          ))}
        </FilterGroup>
        <FilterGroup title="Size">
          <select
            value={size}
            onChange={(event) => setSize(event.target.value)}
            className="h-9 w-full rounded-lg border border-[#ddd8d1] bg-white px-2 text-[11px] outline-none focus:border-[#4f6bff]"
          >
            <option>All sizes</option>
            <option>S</option>
            <option>M</option>
            <option>L</option>
            <option>XL</option>
            <option>XXL</option>
            <option>Custom</option>
            <option>Free size</option>
          </select>
        </FilterGroup>
        <FilterGroup title="Availability">
          {['All availability', 'Ready to ship', 'Made to order'].map(
            (item) => (
              <label
                key={item}
                className="flex cursor-pointer items-center gap-2 py-1.5 text-[11px] font-semibold"
              >
                <input
                  checked={availability === item}
                  onChange={() => setAvailability(item)}
                  type="radio"
                  name="availability"
                  className="accent-[#4f6bff]"
                />{' '}
                {item}
              </label>
            ),
          )}
        </FilterGroup>
      </div>
    </aside>
  );

  if (loading) {
    return (
      <main className="market-shell min-h-[100dvh]">
        <div className="market-container flex min-h-[620px] items-center justify-center">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#696663]">
            <LoaderCircle size={17} className="animate-spin text-[#4f6bff]" />
            Loading the collection…
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="market-shell min-h-[100dvh]">
        <div className="market-container flex min-h-[620px] items-center justify-center">
          <div className="max-w-[420px] rounded-2xl border border-[#f1c9c9] bg-white px-7 py-8 text-center shadow-[0_8px_28px_rgba(23,23,23,.05)]">
            <h1 className="text-xl font-extrabold">The collection is unavailable</h1>
            <p className="mt-2 text-[12px] leading-5 text-[#77736f]">
              {getInsforgeErrorMessage(
                error,
                'We could not load the latest products. Please try again.',
              )}
            </p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-5 rounded-lg bg-[#171717] px-4 py-2.5 text-[11px] font-bold text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (products.length === 0) {
    return (
      <main className="market-shell min-h-[100dvh]">
        <div className="market-container flex min-h-[620px] items-center justify-center">
          <div className="max-w-[420px] rounded-2xl border border-dashed border-[#d8d2ca] bg-white px-7 py-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8e8f7] text-[#4f6bff]">
              <Search size={20} />
            </span>
            <h1 className="mt-4 text-xl font-extrabold">The collection is coming soon</h1>
            <p className="mt-2 text-[12px] leading-5 text-[#77736f]">
              We are preparing the Mahathi collection. Please check back soon.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="market-shell min-h-[100dvh]">
      <div className="market-container pb-20 pt-7">
        <div className="mb-7">
          <p className="font-label text-[9px] uppercase tracking-[.18em] text-[#4f6bff]">
            Mahathi marketplace
          </p>
          <h1 className="mt-2 text-[clamp(2rem,4vw,3.1rem)] font-extrabold tracking-[-.065em]">
            Find something{' '}
            <span className="font-display font-medium italic gradient-text">
              wonderful.
            </span>
          </h1>
          <p className="mt-2 text-[12px] text-[#77736f]">
            {result.length} pieces ready for your wardrobe, from everyday cottons
            to made-to-measure bridal.
          </p>
        </div>
        <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_28px_rgba(23,23,23,.05)] sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4f6bff]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by product, category or craft..."
              className="h-12 w-full rounded-xl bg-[#f7f5f2] pl-11 pr-4 text-[13px] font-semibold outline-none placeholder:font-normal placeholder:text-[#96918c] focus:ring-2 focus:ring-[#4f6bff]/20"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileFilters((value) => !value)}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#ddd8d1] px-5 text-[11px] font-bold lg:hidden"
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
          <label className="relative flex h-12 items-center gap-2 rounded-xl border border-[#ddd8d1] px-4 text-[11px] font-bold">
            <span className="text-[#96918c]">Sort by</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="appearance-none bg-transparent pr-4 outline-none"
            >
              <option>Recommended</option>
              <option>Rating</option>
              <option>Price: low to high</option>
              <option>Price: high to low</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2" />
          </label>
        </div>
        {mobileFilters && (
          <div className="mb-6 rounded-2xl border border-[#e8e4df] bg-white p-5 lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-label text-[9px] uppercase tracking-[.14em] text-[#4f6bff]">
                Refine results
              </span>
              <button
                type="button"
                onClick={() => setMobileFilters(false)}
                aria-label="Close filters"
              >
                <X size={17} />
              </button>
            </div>
            <Sidebar mobile />
          </div>
        )}
        <div className="flex items-start gap-8">
          <Sidebar />
          <section className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between border-b border-[#e8e4df] pb-3">
              <p className="text-[11px] font-bold text-[#494643]">
                {category === 'All products' ? 'All pieces' : category}{' '}
                <span className="font-normal text-[#96918c]">
                  / {result.length} results
                </span>
              </p>
              <div className="hidden items-center gap-2 text-[10px] text-[#96918c] lg:flex">
                <Filter size={13} /> Filters update instantly
              </div>
            </div>
            {result.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3">
                {result.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8d2ca] bg-white px-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8e8f7] text-[#4f6bff]">
                  <Search size={20} />
                </span>
                <h2 className="mt-4 text-lg font-extrabold">No pieces found</h2>
                <p className="mt-2 max-w-[300px] text-[12px] leading-5 text-[#77736f]">
                  Try another search or clear a filter. There is always more in the
                  workroom.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-lg bg-[#171717] px-4 py-2.5 text-[11px] font-bold text-white"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-[#e8e4df] pt-4">
      <h3 className="text-[11px] font-extrabold">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}