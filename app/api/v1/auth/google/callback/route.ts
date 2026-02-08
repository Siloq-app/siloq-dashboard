import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ENDPOINTS } from '@/lib/backend-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { message: 'Authorization code is required' },
        { status: 400 }
      )
    }

    const res = await fetch(`${AUTH_ENDPOINTS.login().replace('/login/', '/google/callback/')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    const data = await res.json()

    if (!res.ok) {
      const message = data.message || data.detail || data.error || 'Google authentication failed'
      return NextResponse.json(
        { message },
        { status: res.status >= 500 ? 500 : res.status }
      )
    }

    return NextResponse.json({
      token: data.token,
      user: data.user,
      message: data.message || 'Authentication successful',
    })
  } catch (error: any) {
    console.error('Google callback proxy error:', error)
    console.error('Backend URL attempted:', AUTH_ENDPOINTS.login().replace('/login/', '/google/callback/'))
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('fetch failed')) {
      return NextResponse.json(
        { message: 'Cannot connect to backend server. Please ensure the Django backend is running.' },
        { status: 502 }
      )
    }
    
    return NextResponse.json(
      { message: 'Unable to complete Google authentication. Please try again.' },
      { status: 502 }
    )
  }
}
