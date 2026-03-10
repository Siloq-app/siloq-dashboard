import { NextRequest, NextResponse } from 'next/server';
import { PAGES_ENDPOINTS } from '@/lib/backend-api';

function getAuthHeader(request: NextRequest): string | null {
  // Check Authorization header first
  const auth = request.headers.get('authorization');
  if (auth) return auth;
  
  // Fall back to X-API-Key and format as Bearer token
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) return `Bearer ${apiKey}`;
  
  return null;
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

export async function POST(request: NextRequest) {
  const auth = getAuthHeader(request);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const url = PAGES_ENDPOINTS.create();
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body),
    });
    
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Pages create proxy error:', e);
    return NextResponse.json(
      { message: 'Unable to reach backend' },
      { status: 502 }
    );
  }
}
