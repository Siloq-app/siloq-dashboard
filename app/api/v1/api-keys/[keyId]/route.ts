import { NextRequest, NextResponse } from 'next/server';
import { API_KEYS_ENDPOINTS } from '@/lib/backend-api';

function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get('authorization');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const auth = getAuthHeader(request);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { keyId } = await params;
  if (!keyId) {
    return NextResponse.json(
      { message: 'Key ID is required' },
      { status: 400 }
    );
  }
  try {
    const res = await fetch(API_KEYS_ENDPOINTS.delete(keyId), {
      method: 'DELETE',
      headers: { Authorization: auth, Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(
      data.message ? data : { message: 'API key revoked successfully' }
    );
  } catch (e) {
    console.error('API key revoke proxy error:', e);
    return NextResponse.json(
      { message: 'Unable to reach backend' },
      { status: 502 }
    );
  }
}
