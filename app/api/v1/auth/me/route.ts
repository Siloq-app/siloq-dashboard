import { NextRequest, NextResponse } from 'next/server';
import { AUTH_ENDPOINTS } from '@/lib/backend';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    console.log('[Auth/Me] Forwarding request to backend:', AUTH_ENDPOINTS.me());

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let res;
    try {
      res = await fetch(AUTH_ENDPOINTS.me(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      console.error('[Auth/Me] Fetch error:', fetchError);
      console.error('[Auth/Me] Backend URL attempted:', AUTH_ENDPOINTS.me());

      // Handle specific network errors
      if (fetchError.name === 'AbortError') {
        console.error('[Auth/Me] Request timeout - backend not responding');
        return NextResponse.json(
          {
            message: 'Auth service timeout. Please try again.',
            error_code: 'TIMEOUT',
            error: 'Backend service not responding',
          },
          { status: 504 }
        );
      }

      if (fetchError.code === 'ECONNREFUSED' || fetchError.code === 'ENOTFOUND') {
        console.error('[Auth/Me] Backend service not reachable');
        return NextResponse.json(
          {
            message: 'Auth service temporarily unavailable.',
            error_code: 'SERVICE_UNAVAILABLE',
            error: 'Backend service not reachable',
          },
          { status: 503 }
        );
      }

      // Generic fetch error
      return NextResponse.json(
        {
          message: 'Unable to reach auth service.',
          error_code: 'PROXY_ERROR',
          error: fetchError.message,
        },
        { status: 502 }
      );
    }

    clearTimeout(timeoutId);

    // Handle backend response
    const contentType = res.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error('[Auth/Me] Non-JSON response from backend:', text);
      data = { detail: 'Backend service unavailable', raw_response: text };
    }

    if (!res.ok) {
      console.log('[Auth/Me] Backend error:', res.status, data);

      // Handle specific HTTP errors
      if (res.status === 502) {
        console.error('[Auth/Me] Backend returned 502 Bad Gateway');
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
        console.error('[Auth/Me] Backend returned 503 Service Unavailable');
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
        console.error('[Auth/Me] Backend returned 504 Gateway Timeout');
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

      return NextResponse.json(
        {
          message: data.detail || data.message || 'Failed to fetch user',
          error_code: data.code,
          status: res.status,
          backend_response: data,
        },
        { status: res.status }
      );
    }

    console.log('[Auth/Me] Success: User data retrieved');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Auth/Me] Proxy error:', error);
    console.error('[Auth/Me] Backend URL attempted:', AUTH_ENDPOINTS.me());

    // Handle different types of errors
    if (error.name === 'AbortError') {
      console.error('[Auth/Me] Request timeout - backend not responding');
      return NextResponse.json(
        {
          message: 'Auth service timeout. Please try again.',
          error_code: 'TIMEOUT',
          error: 'Backend service not responding',
        },
        { status: 504 }
      );
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('[Auth/Me] Backend service not reachable');
      return NextResponse.json(
        {
          message: 'Auth service temporarily unavailable.',
          error_code: 'SERVICE_UNAVAILABLE',
          error: 'Backend service not reachable',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        message: 'Unable to reach auth service.',
        error_code: 'PROXY_ERROR',
        error: error.message,
      },
      { status: 502 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(AUTH_ENDPOINTS.me(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data.detail || data.message || 'Failed to update profile' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Me PATCH proxy error:', error);
    return NextResponse.json({ message: 'Unable to reach auth service.' }, { status: 502 });
  }
}
