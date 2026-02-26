import { NextRequest, NextResponse } from 'next/server';
import { AUTH_ENDPOINTS } from '@/lib/backend-api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[Auth/Me] Forwarding request to backend:', AUTH_ENDPOINTS.me());

    const res = await fetch(AUTH_ENDPOINTS.me(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.log('[Auth/Me] Backend error:', res.status, data);
      return NextResponse.json(
        { 
          message: data.detail || data.message || 'Failed to fetch user',
          error_code: data.code,
          status: res.status 
        },
        { status: res.status }
      );
    }

    console.log('[Auth/Me] Success: User data retrieved');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Auth/Me] Proxy error:', error);
    console.error('[Auth/Me] Backend URL attempted:', AUTH_ENDPOINTS.me());
    
    return NextResponse.json(
      { 
        message: 'Unable to reach auth service.',
        error: error.message 
      },
      { status: 502 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const res = await fetch(AUTH_ENDPOINTS.me(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
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
    return NextResponse.json(
      { message: 'Unable to reach auth service.' },
      { status: 502 }
    );
  }
}
