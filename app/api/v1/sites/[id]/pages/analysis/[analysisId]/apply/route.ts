import { NextRequest, NextResponse } from 'next/server';
import { SITES_ENDPOINTS } from '@/lib/backend-api';

function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get('authorization');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; analysisId: string }> }
) {
  const auth = getAuthHeader(request);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id, analysisId } = await params;
    const url = `${SITES_ENDPOINTS.pagesAnalysis(id)}${analysisId}/apply/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: auth, Accept: 'application/json', 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (e) {
    console.error('Pages analysis apply proxy error:', e);
    return NextResponse.json({ message: 'Unable to reach backend' }, { status: 502 });
  }
}
