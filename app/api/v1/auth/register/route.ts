import { NextRequest, NextResponse } from 'next/server';
import { AUTH_ENDPOINTS } from '@/lib/backend-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const res = await fetch(AUTH_ENDPOINTS.register(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name: name || '',
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message =
        data.email?.[0] ||
        data.password?.[0] ||
        data.detail ||
        data.message ||
        'Registration failed';
      return NextResponse.json(
        {
          message:
            typeof message === 'string' ? message : 'Registration failed',
        },
        { status: res.status >= 500 ? 500 : res.status }
      );
    }

    return NextResponse.json(
      {
        message: data.message,
        token: data.token,
        user: data.user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register proxy error:', error);
    return NextResponse.json(
      { message: 'Unable to reach auth service. Please try again.' },
      { status: 502 }
    );
  }
}
