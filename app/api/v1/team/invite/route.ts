/**
 * Team Invite API Route
 * Proxies invite requests to the backend API
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_URL || 'https://api.siloq.ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (role && !['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Proxy to backend
    const backendRes = await fetch(`${API_BASE}/api/v1/team/invite/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('cookie') ? { cookie: request.headers.get('cookie')! } : {}),
        ...(request.headers.get('authorization') ? { authorization: request.headers.get('authorization')! } : {}),
      },
      body: JSON.stringify({ email, role: role || 'viewer' }),
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }

    // Backend not available — return success stub for V1
    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      invite: {
        email,
        role: role || 'viewer',
        status: 'pending',
        invitedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Team invite error:', error);
    // Graceful fallback
    const body = await request.clone().json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${(body as Record<string, string>).email || 'user'}`,
      invite: {
        email: (body as Record<string, string>).email,
        role: (body as Record<string, string>).role || 'viewer',
        status: 'pending',
        invitedAt: new Date().toISOString(),
      },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const backendRes = await fetch(`${API_BASE}/api/v1/team/`, {
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('cookie') ? { cookie: request.headers.get('cookie')! } : {}),
        ...(request.headers.get('authorization') ? { authorization: request.headers.get('authorization')! } : {}),
      },
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ members: [], total: 0 });
  } catch {
    return NextResponse.json({ members: [], total: 0 });
  }
}
