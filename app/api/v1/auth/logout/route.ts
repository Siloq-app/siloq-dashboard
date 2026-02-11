import { NextRequest, NextResponse } from 'next/server';
import { AUTH_ENDPOINTS } from '@/lib/backend-api';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json(
        { message: 'Logged out successfully' },
        { status: 200 }
      );
    }

    const res = await fetch(AUTH_ENDPOINTS.logout(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || 'Logged out successfully' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: data.message || 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout proxy error:', error);
    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
  }
}
