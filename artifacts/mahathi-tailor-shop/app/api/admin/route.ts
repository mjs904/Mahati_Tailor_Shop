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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { table, id, status } = body;

    if (!table || !id || !status) {
      return NextResponse.json(
        { success: false, error: 'table, id, and status are required' },
        { status: 400 },
      );
    }

    const allowedTables = ['appointments', 'tailoring_requests', 'aari_requests', 'orders'];
    if (!allowedTables.includes(table)) {
      return NextResponse.json({ success: false, error: 'Invalid table name' }, { status: 400 });
    }

    const res = await fetch(
      `${INSFORGE_URL}/api/database/records/${table}?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { success: false, error: errText || 'Failed to update status' },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error updating status' },
      { status: 500 },
    );
  }
}
