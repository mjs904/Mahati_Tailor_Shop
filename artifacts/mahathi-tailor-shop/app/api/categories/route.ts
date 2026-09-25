import { NextRequest, NextResponse } from 'next/server';

const INSFORGE_URL = (
  process.env.NEXT_PUBLIC_INSFORGE_URL ||
  'https://jk3f7ixk.us-east.insforge.app'
).trim().replace(/\/+$/, '');

const INSFORGE_KEY = (
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ||
  'ik_f1506c66409346efbb2378b1abc33eae'
).trim();

const headers = {
  apikey: INSFORGE_KEY,
  Authorization: `Bearer ${INSFORGE_KEY}`,
  'Content-Type': 'application/json',
};

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (!payload.name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required.' },
        { status: 400 },
      );
    }

    const res = await fetch(`${INSFORGE_URL}/api/database/records/categories`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedErr: any = null;
      try {
        parsedErr = JSON.parse(errText);
      } catch {}
      const errMsg =
        parsedErr?.message || parsedErr?.details || errText || 'Could not add category';
      return NextResponse.json({ success: false, error: errMsg }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      category: Array.isArray(data) ? data[0] : data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error creating category' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing category ID to delete.' },
        { status: 400 },
      );
    }

    const res = await fetch(
      `${INSFORGE_URL}/api/database/records/categories?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers,
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { success: false, error: errText || 'Failed to delete category' },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error deleting category' },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const res = await fetch(
      `${INSFORGE_URL}/api/database/records/categories?order=created_at.desc`,
      { headers },
    );
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch categories' },
        { status: res.status },
      );
    }
    const categories = await res.json();
    return NextResponse.json({
      success: true,
      categories: Array.isArray(categories) ? categories : [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error fetching categories' },
      { status: 500 },
    );
  }
}
