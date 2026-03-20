import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl } from '@/lib/backend-api';

function getAuthHeader(r: NextRequest) { return r.headers.get('authorization'); }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthHeader(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const page = req.nextUrl.searchParams.get('page') || '1';
  const status = req.nextUrl.searchParams.get('status') || 'pending';
  const pageSize = req.nextUrl.searchParams.get('page_size') || '50';
  try {
    const res = await fetch(
      `${getBackendApiUrl()}/api/v1/sites/${id}/pending-actions/?page=${page}&status=${status}&page_size=${pageSize}`,
      { headers: { Authorization: auth, Accept: 'application/json' } }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch { return NextResponse.json({ message: 'Unable to reach backend' }, { status: 502 }); }
}
