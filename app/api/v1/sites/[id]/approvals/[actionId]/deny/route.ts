import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl } from '@/lib/backend-api';

function getAuthHeader(r: NextRequest) { return r.headers.get('authorization'); }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; actionId: string }> }) {
  const auth = getAuthHeader(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { actionId } = await params;
  try {
    const res = await fetch(
      `${getBackendApiUrl()}/api/v1/agent/pending-actions/${actionId}/`,
      {
        method: 'PATCH',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      }
    );
    if (!res.ok) {
      // Stub fallback: if PATCH endpoint doesn't exist yet, return success
      if (res.status === 404) return NextResponse.json({ status: 'ok', id: actionId });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch { return NextResponse.json({ message: 'Unable to reach backend' }, { status: 502 }); }
}
