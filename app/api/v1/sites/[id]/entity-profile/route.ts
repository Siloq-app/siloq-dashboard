import { NextRequest, NextResponse } from 'next/server';
import { SITES_ENDPOINTS } from '@/lib/backend-api';

function getAuthHeader(r: NextRequest) { return r.headers.get('authorization'); }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthHeader(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const res = await fetch(SITES_ENDPOINTS.entityProfile(id), { headers: { Authorization: auth } });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch { return NextResponse.json({ message: 'Unable to reach backend' }, { status: 502 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthHeader(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();
    const res = await fetch(SITES_ENDPOINTS.entityProfile(id), {
      method: 'PATCH',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch { return NextResponse.json({ message: 'Unable to reach backend' }, { status: 502 }); }
}
