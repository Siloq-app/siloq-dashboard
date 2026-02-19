import { NextRequest, NextResponse } from 'next/server';
import { SITES_ENDPOINTS } from '@/lib/backend-api';

function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get('authorization');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthHeader(request);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const pageUrl = searchParams.get('page_url');
    const url = pageUrl
      ? `${SITES_ENDPOINTS.pagesAnalysis(id)}?page_url=${encodeURIComponent(pageUrl)}`
      : SITES_ENDPOINTS.pagesAnalysis(id);
    const res = await fetch(url, {
      headers: { Authorization: auth, Accept: 'application/json' },
    });
    if (res.status === 404) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Pages analysis proxy error:', e);
    return NextResponse.json(
      { message: 'Unable to reach backend' },
      { status: 502 }
    );
  }
}
