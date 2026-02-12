import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl, SITES_ENDPOINTS } from '@/lib/backend-api';

function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get('authorization');
}

export async function GET(request: NextRequest) {
  const auth = getAuthHeader(request);
  if (!auth) {
    return NextResponse.json(
      { message: 'Unauthorized - No auth header' },
      { status: 401 }
    );
  }
  try {
    const backendUrl = SITES_ENDPOINTS.list();

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Authorization: auth,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      return NextResponse.json(
        { message: `Backend returned ${res.status} ${res.statusText}. Expected JSON but got: ${text.slice(0, 100)}` },
        { status: res.status || 502 }
      );
    }
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e: any) {
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
    const backendUrl = SITES_ENDPOINTS.list();
    
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      return NextResponse.json(
        { message: `Backend returned ${res.status} ${res.statusText}. Expected JSON but got: ${text.slice(0, 100)}` },
        { status: res.status || 502 }
      );
    }
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
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
