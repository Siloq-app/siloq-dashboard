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

    const res = await fetch(AUTH_ENDPOINTS.me(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data.detail || data.message || 'Failed to fetch user' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Me proxy error:', error);
    return NextResponse.json(
      { message: 'Unable to reach auth service.' },
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
