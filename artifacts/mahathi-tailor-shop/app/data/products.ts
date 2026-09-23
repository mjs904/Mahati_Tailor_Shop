import { getInsforgeTable, INSFORGE_TABLES } from '../../lib/insforge';

export type Product = {
  id: string;
  slug?: string;
  name: string;
  description: string;
  category: string;
  categoryId?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  stock: string;
  sizes: string[];
  image: string;
  badge?: string;
  tone: string;
};

export type Category = {
  id: string;
  name: string;
  slug?: string;
  count: string;
  image: string;
  tone: string;
};

export type CatalogSnapshot = {
  categories: Category[];
  products: Product[];
  error: unknown | null;
};

type RawRecord = Record<string, unknown>;

const fallbackCategoryArt: Record<string, string> = {
  dresses: '/kurta-set.jpg',
  sarees: '/saree-plum.jpg',
  blouses: '/aari-blouse.jpg',
  bridal: '/mahathi-atelier.jpg',
  'aari work': '/aari-blouse.jpg',
  embroidery: '/aari-blouse.jpg',
  kids: '/kurta-set.jpg',
  accessories: '/organza-dupatta.jpg',
};

const fallbackCategoryTones: Record<string, string> = {
  dresses: '#e3edf3',
  sarees: '#f4e3e8',
  blouses: '#e7e0f0',
  bridal: '#eee4d8',
  'aari work': '#eee7f2',
  embroidery: '#f1e2e4',
  kids: '#e9f0ed',
  accessories: '#eee7f2',
};

const fallbackTone = '#f0e8df';

function asRecord(value: unknown): RawRecord {
  return value && typeof value === 'object' ? (value as RawRecord) : {};
}

function firstValue(record: RawRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
}

function stringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value.trim() || fallback;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[₹,\s]/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizeKey(value: unknown): string {
  return stringValue(value).toLowerCase().trim();
}

function normalizeStock(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'In stock';
  }
  if (typeof value === 'number') {
    if (value <= 0) return 'Out of stock';
    if (value === 1) return 'Only 1 left';
    if (value <= 3) return `Only ${value} left`;
    return 'In stock';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 'In stock';
    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      if (num <= 0) return 'Out of stock';
      if (num === 1) return 'Only 1 left';
      if (num <= 3) return `Only ${num} left`;
      return 'In stock';
    }
    return trimmed;
  }
  return 'In stock';
}

function isActiveRecord(record: RawRecord): boolean {
  const explicitActive = firstValue(record, [
    'is_active',
    'isActive',
    'active',
    'enabled',
    'published',
  ]);

  if (typeof explicitActive === 'boolean') {
    return explicitActive;
  }
  if (typeof explicitActive === 'number') {
    return explicitActive === 1;
  }
  if (typeof explicitActive === 'string' && explicitActive.trim()) {
    return ['true', '1', 'active', 'enabled', 'published', 'yes'].includes(
      explicitActive.toLowerCase().trim(),
    );
  }

  const status = normalizeKey(firstValue(record, ['status', 'state']));
  if (status) {
    return !['inactive', 'disabled', 'archived', 'deleted', 'draft', 'hidden'].includes(
      status,
    );
  }

  return true;
}

function relationRecord(record: RawRecord, keys: string[]): RawRecord {
  const relation = firstValue(record, keys);
  return asRecord(relation);
}

function extractId(record: RawRecord): string {
  return stringValue(firstValue(record, ['id', 'uuid', 'product_id', 'category_id']));
}

function extractName(record: RawRecord): string {
  return stringValue(firstValue(record, ['name', 'title', 'label', 'display_name']));
}

function extractCategoryReference(
  record: RawRecord,
  categoryNames: Map<string, string>,
): { id?: string; name: string } {
  const relation = relationRecord(record, ['category', 'categories']);
  const relationId = extractId(relation);
  const relationName = extractName(relation);
  const rawCategoryId = firstValue(record, [
    'category_id',
    'categoryId',
    'category_uuid',
  ]);
  const rawCategory = firstValue(record, ['category_name', 'category']);
  const categoryId = stringValue(rawCategoryId || relationId);
  const rawCategoryName =
    relationName ||
    (typeof rawCategory === 'string' ? rawCategory : '') ||
    stringValue(firstValue(record, ['category_title', 'category_label']));
  const mappedName =
    categoryNames.get(normalizeKey(categoryId)) ||
    categoryNames.get(normalizeKey(rawCategoryName)) ||
    rawCategoryName ||
    'Other';

  return {
    id: categoryId || undefined,
    name: mappedName,
  };
}

function extractImage(record: RawRecord, fallback: string): string {
  const directImage = firstValue(record, [
    'image_url',
    'imageUrl',
    'image',
    'thumbnail_url',
    'thumbnail',
    'photo_url',
  ]);

  if (typeof directImage === 'string' && directImage.trim()) {
    return directImage.trim();
  }
  if (Array.isArray(directImage)) {
    const firstImage = directImage.find((value) => typeof value === 'string');
    if (typeof firstImage === 'string' && firstImage.trim()) {
      return firstImage.trim();
    }
  }
  if (directImage && typeof directImage === 'object') {
    const nestedImage = stringValue(
      firstValue(asRecord(directImage), ['url', 'src', 'path']),
    );
    if (nestedImage) {
      return nestedImage;
    }
  }
  return fallback;
}

function extractSizes(record: RawRecord, categoryName = ''): string[] {
  const rawSizes = firstValue(record, [
    'sizes',
    'available_sizes',
    'availableSizes',
    'size',
  ]);

  if (Array.isArray(rawSizes) && rawSizes.length > 0) {
    return rawSizes.map((value) => stringValue(value)).filter(Boolean);
  }
  if (typeof rawSizes === 'string' && rawSizes.trim()) {
    const value = rawSizes.trim();
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => stringValue(item)).filter(Boolean);
      }
    } catch {
      // Comma-separated size strings are handled below.
    }
    const parts = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts;
  }

  const catLower = categoryName.toLowerCase();
  if (catLower.includes('saree') || catLower.includes('dupatta')) {
    return ['Free size'];
  }
  if (
    catLower.includes('blouse') ||
    catLower.includes('kurta') ||
    catLower.includes('dress') ||
    catLower.includes('lehenga')
  ) {
    return ['S', 'M', 'L', 'XL', 'Custom'];
  }

  return ['Free size'];
}

function normalizeCategory(
  record: RawRecord,
  productCount: number,
): Category | null {
  const name = extractName(record);
  if (!name) {
    return null;
  }

  const key = normalizeKey(name);
  const id = extractId(record) || stringValue(firstValue(record, ['slug'])) || name;
  const rawCount = firstValue(record, ['count', 'product_count', 'productCount']);
  const count =
    typeof rawCount === 'string' && rawCount.toLowerCase().includes('style')
      ? rawCount
      : `${numberValue(rawCount, productCount)} styles`;

  return {
    id,
    name,
    slug: stringValue(firstValue(record, ['slug', 'handle'])) || undefined,
    count,
    image: extractImage(
      record,
      fallbackCategoryArt[key] || '/mahathi-atelier.jpg',
    ),
    tone:
      stringValue(firstValue(record, ['tone', 'background_color', 'backgroundColor'])) ||
      fallbackCategoryTones[key] ||
      fallbackTone,
  };
}

function normalizeProduct(
  record: RawRecord,
  categoryNames: Map<string, string>,
): Product | null {
  const id = extractId(record);
  const name = extractName(record);
  const price = numberValue(
    firstValue(record, ['price', 'sale_price', 'salePrice', 'current_price']),
    NaN,
  );

  if (!id || !name || !Number.isFinite(price)) {
    return null;
  }

  const category = extractCategoryReference(record, categoryNames);
  const originalPrice = numberValue(
    firstValue(record, [
      'original_price',
      'originalPrice',
      'compare_at_price',
      'compareAtPrice',
      'mrp',
      'list_price',
    ]),
    NaN,
  );
  const categoryTone = fallbackCategoryTones[normalizeKey(category.name)];

  return {
    id,
    slug: stringValue(firstValue(record, ['slug', 'handle'])) || undefined,
    name,
    description: stringValue(
      firstValue(record, ['description', 'short_description', 'summary']),
    ),
    category: category.name,
    categoryId: category.id,
    price,
    originalPrice:
      Number.isFinite(originalPrice) && originalPrice > price
        ? originalPrice
        : undefined,
    rating: numberValue(
      firstValue(record, ['rating', 'average_rating', 'averageRating', 'avg_rating']),
    ),
    reviews: numberValue(
      firstValue(record, [
        'review_count',
        'reviewCount',
        'reviews',
        'reviews_count',
        'rating_count',
      ]),
    ),
    stock: normalizeStock(
      firstValue(record, [
        'stock',
        'availability',
        'stock_status',
        'stockStatus',
        'inventory_status',
      ]),
    ),
    sizes: extractSizes(record, category.name),
    image: extractImage(record, '/mahathi-atelier.jpg'),
    badge:
      stringValue(firstValue(record, ['badge', 'label', 'tag'])) || undefined,
    tone:
      stringValue(firstValue(record, ['tone', 'background_color', 'backgroundColor'])) ||
      categoryTone ||
      fallbackTone,
  };
}

export async function fetchCatalog(): Promise<CatalogSnapshot> {
  const [categoryResult, productResult] = await Promise.all([
    getInsforgeTable(INSFORGE_TABLES.categories).select(),
    getInsforgeTable(INSFORGE_TABLES.products).select(),
  ]);

  const error = categoryResult.error || productResult.error || null;
  const rawCategories = Array.isArray(categoryResult.data)
    ? categoryResult.data.map(asRecord).filter(isActiveRecord)
    : [];
  const rawProducts = Array.isArray(productResult.data)
    ? productResult.data.map(asRecord).filter(isActiveRecord)
    : [];

  const categoryNames = new Map<string, string>();
  for (const category of rawCategories) {
    const name = extractName(category);
    if (!name) {
      continue;
    }
    const categoryId = extractId(category);
    const slug = stringValue(firstValue(category, ['slug', 'handle']));
    categoryNames.set(normalizeKey(name), name);
    if (categoryId) {
      categoryNames.set(normalizeKey(categoryId), name);
    }
    if (slug) {
      categoryNames.set(normalizeKey(slug), name);
    }
  }

  const products = rawProducts
    .map((product) => normalizeProduct(product, categoryNames))
    .filter((product): product is Product => Boolean(product));

  const productCounts = new Map<string, number>();
  for (const product of products) {
    productCounts.set(
      normalizeKey(product.category),
      (productCounts.get(normalizeKey(product.category)) || 0) + 1,
    );
  }

  const categories = rawCategories
    .map((category) =>
      normalizeCategory(
        category,
        productCounts.get(normalizeKey(extractName(category))) || 0,
      ),
    )
    .filter((category): category is Category => Boolean(category));

  // Synthesize any categories that products reference but are not yet in the categories table
  const existingCategoryKeys = new Set(
    categories.map((c) => normalizeKey(c.name)),
  );
  const synthesizedCategories: Category[] = [];
  for (const product of products) {
    const catKey = normalizeKey(product.category);
    if (catKey && !existingCategoryKeys.has(catKey)) {
      existingCategoryKeys.add(catKey);
      synthesizedCategories.push({
        id: product.categoryId || catKey,
        name: product.category,
        slug: catKey.replace(/\s+/g, '-'),
        count: `${productCounts.get(catKey) || 1} styles`,
        image: fallbackCategoryArt[catKey] || '/mahathi-atelier.jpg',
        tone: fallbackCategoryTones[catKey] || fallbackTone,
      });
    }
  }

  return { categories: [...categories, ...synthesizedCategories], products, error };
}

export async function fetchProductById(id: string): Promise<{
  product: Product | null;
  error: unknown | null;
}> {
  const catalog = await fetchCatalog();
  const search = id.toLowerCase().trim();
  let found = catalog.products.find(
    (product) =>
      product.id.toLowerCase() === search ||
      (product.slug && product.slug.toLowerCase() === search),
  );

  if (!found) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
      const query = isUuid
        ? getInsforgeTable(INSFORGE_TABLES.products).select().or(`id.eq.${id.trim()},slug.eq.${id.trim()}`)
        : getInsforgeTable(INSFORGE_TABLES.products).select().eq('slug', id.trim());

      const { data } = await query.limit(1);

      if (data && data.length > 0) {
        const categoryMap = new Map<string, string>();
        catalog.categories.forEach((c) => {
          categoryMap.set(c.id.toLowerCase(), c.name);
          if (c.slug) categoryMap.set(c.slug.toLowerCase(), c.name);
        });
        found = normalizeProduct(asRecord(data[0]), categoryMap) || undefined;
      }
    } catch {
      // ignore
    }
  }

  return {
    product: found || null,
    error: catalog.error,
  };
}

export const formatPrice = (price: number) =>
  `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const discountPercent = (product: Product) =>
  product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;