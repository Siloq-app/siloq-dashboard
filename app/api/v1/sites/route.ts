import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl, SITES_ENDPOINTS } from '@/lib/backend-api';

function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get('authorization');
}

export async function GET(request: NextRequest) {
  const auth = getAuthHeader(request);
  console.log(
    'Sites API - Auth header received:',
    auth ? 'Present' : 'Missing'
  );
  if (!auth) {
    return NextResponse.json(
      { message: 'Unauthorized - No auth header' },
      { status: 401 }
    );
  }
  try {
    const backendUrl = SITES_ENDPOINTS.list();
    console.log('Sites API - Forwarding to backend:', backendUrl);
    console.log(
      'Sites API - Auth header prefix:',
      auth?.substring(0, 20) + '...'
    );

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Authorization: auth,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    console.log('Sites API - Backend response status:', res.status);
    if (!res.ok) {
      console.log('Sites API - Backend error:', data);
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('Sites list proxy error:', e);
    const errorCode = e?.cause?.code || e?.code;
    const isConnectionRefused =
      errorCode === 'ECONNREFUSED' || e?.message?.includes('fetch failed');
    const isConnectionReset =
      errorCode === 'ECONNRESET' || errorCode === 'ECONNRESET';

    let message = 'Unable to reach backend';
    let code = 'PROXY_ERROR';

    if (isConnectionRefused) {
      message =
        'Backend server is offline. Please start the backend server on port 8000.';
      code = 'BACKEND_OFFLINE';
    } else if (isConnectionReset) {
      message =
        'Backend connection was reset. The backend may be restarting or rejecting the request.';
      code = 'CONN_RESET';
    }

    return NextResponse.json(
      { message, code, detail: e?.message },
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
    const res = await fetch(SITES_ENDPOINTS.list(), {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    console.error('Sites create proxy error:', e);
    const errorCode = e?.cause?.code || e?.code;
    const isConnectionRefused = errorCode === 'ECONNREFUSED';
    const isConnectionReset = errorCode === 'ECONNRESET';

    let message = 'Unable to reach backend';
    let code = 'PROXY_ERROR';

    if (isConnectionRefused) {
      message =
        'Backend server is offline. Please start the backend server on port 8000.';
      code = 'BACKEND_OFFLINE';
    } else if (isConnectionReset) {
      message =
        'Backend connection was reset. The backend may be restarting or rejecting the request.';
      code = 'CONN_RESET';
    }

    return NextResponse.json(
      { message, code, detail: e?.message },
      { status: 502 }
    );
  }
}
