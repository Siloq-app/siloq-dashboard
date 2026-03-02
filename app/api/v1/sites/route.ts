import { NextRequest, NextResponse } from 'next/server';
import { SITES_ENDPOINTS } from '@/lib/backend';

function getAuthHeader(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (auth) return auth;

  const apiKey = request.headers.get('x-api-key');
  if (apiKey) return `Bearer ${apiKey}`;

  return null;
}

export async function GET(request: NextRequest) {
  const auth = getAuthHeader(request);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized - No auth header' }, { status: 401 });
  }
  try {
    const backendUrl = SITES_ENDPOINTS.list();

    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let res;
    try {
      res = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          Authorization: auth,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      console.error('[Sites] Fetch error:', fetchError);
      console.error('[Sites] Backend URL attempted:', backendUrl);

      // Handle specific network errors
      if (fetchError.name === 'AbortError') {
        console.error('[Sites] Request timeout - backend not responding');
        return NextResponse.json(
          {
            message: 'Sites service timeout. Please try again.',
            error_code: 'TIMEOUT',
            error: 'Backend service not responding',
          },
          { status: 504 }
        );
      }

      if (fetchError.code === 'ECONNREFUSED' || fetchError.code === 'ENOTFOUND') {
        console.error('[Sites] Backend service not reachable');
        return NextResponse.json(
          {
            message: 'Sites service temporarily unavailable.',
            error_code: 'SERVICE_UNAVAILABLE',
            error: 'Backend service not reachable',
          },
          { status: 503 }
        );
      }

      // Generic fetch error
      return NextResponse.json(
        {
          message: 'Unable to reach sites service.',
          error_code: 'PROXY_ERROR',
          error: fetchError.message,
        },
        { status: 502 }
      );
    }

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      return NextResponse.json(
        {
          message: `Backend returned ${res.status} ${res.statusText}. Expected JSON but got: ${text.slice(0, 100)}`,
        },
        { status: res.status || 502 }
      );
    }
    const data = await res.json();
    if (!res.ok) {
      // Handle specific HTTP errors
      if (res.status === 502) {
        console.error('[Sites] Backend returned 502 Bad Gateway');
        return NextResponse.json(
          {
            message: 'Backend service temporarily unavailable.',
            error_code: 'BAD_GATEWAY',
            status: res.status,
            backend_response: data,
          },
          { status: 502 }
        );
      }

      if (res.status === 503) {
        console.error('[Sites] Backend returned 503 Service Unavailable');
        return NextResponse.json(
          {
            message: 'Backend service temporarily unavailable.',
            error_code: 'SERVICE_UNAVAILABLE',
            status: res.status,
            backend_response: data,
          },
          { status: 503 }
        );
      }

      if (res.status === 504) {
        console.error('[Sites] Backend returned 504 Gateway Timeout');
        return NextResponse.json(
          {
            message: 'Backend service timeout.',
            error_code: 'GATEWAY_TIMEOUT',
            status: res.status,
            backend_response: data,
          },
          { status: 504 }
        );
      }

      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    const errorCode = e?.cause?.code || e?.code;
    const isConnectionRefused =
      errorCode === 'ECONNREFUSED' || e?.message?.includes('fetch failed');
    const isConnectionReset = errorCode === 'ECONNRESET' || errorCode === 'ECONNRESET';

    let message = 'Unable to reach backend';
    let code = 'PROXY_ERROR';

    if (isConnectionRefused) {
      message = 'Backend server is offline. Please start the backend server on port 8000.';
      code = 'BACKEND_OFFLINE';
    } else if (isConnectionReset) {
      message =
        'Backend connection was reset. The backend may be restarting or rejecting the request.';
      code = 'CONN_RESET';
    }

    return NextResponse.json({ message, code, detail: e?.message }, { status: 502 });
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
        {
          message: `Backend returned ${res.status} ${res.statusText}. Expected JSON but got: ${text.slice(0, 100)}`,
        },
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
      message = 'Backend server is offline. Please start the backend server on port 8000.';
      code = 'BACKEND_OFFLINE';
    } else if (isConnectionReset) {
      message =
        'Backend connection was reset. The backend may be restarting or rejecting the request.';
      code = 'CONN_RESET';
    }

    return NextResponse.json({ message, code, detail: e?.message }, { status: 502 });
  }
}
