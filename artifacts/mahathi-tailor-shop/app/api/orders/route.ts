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

const isValidUuid = (val?: string | null) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      orderNumber,
      shipping,
      paymentMethod = 'cod',
      items = [],
      subtotal = 0,
      shippingFee = 0,
      discount = 0,
      total = 0,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User must be authenticated to place an order.' },
        { status: 401 },
      );
    }

    if (!shipping?.name || !shipping?.phone || !shipping?.address || !shipping?.pincode) {
      return NextResponse.json(
        { success: false, error: 'Incomplete delivery address or contact information provided.' },
        { status: 400 },
      );
    }

    // 1. Upsert Profile for userId
    try {
      const profRes = await fetch(
        `${INSFORGE_URL}/api/database/records/profiles?id=eq.${encodeURIComponent(userId)}`,
        { headers },
      );
      const profRows = await profRes.json();
      if (Array.isArray(profRows) && profRows.length > 0) {
        await fetch(
          `${INSFORGE_URL}/api/database/records/profiles?id=eq.${encodeURIComponent(userId)}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              name: shipping.name.trim(),
              phone: shipping.phone.trim(),
              address: shipping.address.trim(),
              city: shipping.city?.trim() || 'Hyderabad',
              state: shipping.state?.trim() || 'Telangana',
              pincode: shipping.pincode.trim(),
            }),
          },
        );
      } else {
        await fetch(`${INSFORGE_URL}/api/database/records/profiles`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            id: userId,
            name: shipping.name.trim(),
            phone: shipping.phone.trim(),
            email: shipping.email?.trim() || '',
            address: shipping.address.trim(),
            city: shipping.city?.trim() || 'Hyderabad',
            state: shipping.state?.trim() || 'Telangana',
            pincode: shipping.pincode.trim(),
          }),
        });
      }
    } catch (profErr) {
      console.warn('Profile sync in orders API note:', profErr);
    }

    // 2. Insert Order
    const effectiveOrderNumber =
      orderNumber ||
      `MTS-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

    const orderPayload = {
      user_id: userId,
      order_number: effectiveOrderNumber,
      status: 'pending',
      payment_status: 'pending',
      payment_method: paymentMethod,
      subtotal: Number(subtotal) || 0,
      shipping_fee: Number(shippingFee) || 0,
      discount: Number(discount) || 0,
      total_amount: Number(total) || 0,
      shipping_name: shipping.name.trim(),
      shipping_phone: shipping.phone.trim(),
      shipping_address: shipping.address.trim(),
      shipping_city: shipping.city?.trim() || 'Hyderabad',
      shipping_state: shipping.state?.trim() || 'Telangana',
      shipping_pincode: shipping.pincode.trim(),
      notes: shipping.notes?.trim() || null,
    };

    const orderRes = await fetch(`${INSFORGE_URL}/api/database/records/orders`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(orderPayload),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      let parsedErr: any = null;
      try {
        parsedErr = JSON.parse(errText);
      } catch {}
      const errMsg =
        parsedErr?.message || parsedErr?.details || errText || 'Could not record order';
      return NextResponse.json({ success: false, error: errMsg }, { status: orderRes.status });
    }

    const orderData = await orderRes.json();
    const createdOrder = Array.isArray(orderData) ? orderData[0] : orderData;

    // 3. Insert Order Items
    if (createdOrder?.id && Array.isArray(items) && items.length > 0) {
      const itemsPayload = items.map((item: any) => ({
        order_id: createdOrder.id,
        product_id: isValidUuid(item.productId) ? item.productId : null,
        product_name: `${item.name || 'Boutique Product'}${item.size ? ` (${item.size})` : ''}`,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        total: (Number(item.price) || 0) * (Number(item.quantity) || 1),
      }));

      try {
        await fetch(`${INSFORGE_URL}/api/database/records/order_items`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'return=representation' },
          body: JSON.stringify(itemsPayload),
        });
      } catch (itemErr) {
        console.warn('Order items insert note:', itemErr);
      }
    }

    return NextResponse.json({ success: true, order: createdOrder });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error recording order' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, paymentStatus, razorpayPaymentId, status } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
    }

    const patchPayload: Record<string, any> = {};
    if (paymentStatus) patchPayload.payment_status = paymentStatus;
    if (razorpayPaymentId) patchPayload.razorpay_payment_id = razorpayPaymentId;
    if (status) patchPayload.status = status;

    const res = await fetch(
      `${INSFORGE_URL}/api/database/records/orders?id=eq.${encodeURIComponent(orderId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(patchPayload),
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to update order' },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const isAdmin = url.searchParams.get('admin') === 'true';

    let endpoint = `${INSFORGE_URL}/api/database/records/orders?order=created_at.desc`;
    if (userId && !isAdmin) {
      endpoint = `${INSFORGE_URL}/api/database/records/orders?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`;
    }

    const oRes = await fetch(endpoint, { headers });
    if (!oRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: oRes.status },
      );
    }
    const orders = await oRes.json();

    // If admin, fetch all order items and associate with orders
    if (isAdmin && Array.isArray(orders) && orders.length > 0) {
      try {
        const iRes = await fetch(`${INSFORGE_URL}/api/database/records/order_items`, { headers });
        if (iRes.ok) {
          const allItems = await iRes.json();
          const enriched = orders.map((o: any) => ({
            ...o,
            order_items: (allItems || []).filter((it: any) => it.order_id === o.id),
          }));
          return NextResponse.json({ success: true, orders: enriched });
        }
      } catch {}
    }

    return NextResponse.json({ success: true, orders: Array.isArray(orders) ? orders : [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 },
    );
  }
}
