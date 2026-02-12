import { NextRequest, NextResponse } from 'next/server';
import { PAGES_ENDPOINTS } from '@/lib/backend-api';

function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get('authorization');
}

export async function GET(request: NextRequest) {
  const auth = getAuthHeader(request);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const siteId = request.nextUrl.searchParams.get('site_id');
  try {
    const url = PAGES_ENDPOINTS.list(siteId ?? undefined);
    const res = await fetch(url, {
      headers: { Authorization: auth, Accept: 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Pages list proxy error:', e);
    return NextResponse.json(
      { message: 'Unable to reach backend' },
      { status: 502 }
    );
  }
}
