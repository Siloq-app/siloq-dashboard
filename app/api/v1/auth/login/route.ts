import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ENDPOINTS } from '@/lib/backend-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const res = await fetch(AUTH_ENDPOINTS.login(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      const message = data.email?.[0] || data.password?.[0] || data.detail || data.message || 'Login failed'
      return NextResponse.json(
        { message: typeof message === 'string' ? message : 'Invalid email or password' },
        { status: res.status >= 500 ? 500 : res.status }
      )
    }

    return NextResponse.json({
      message: data.message,
      token: data.token,
      user: data.user,
    })
  } catch (error) {
    console.error('Login proxy error:', error)
    return NextResponse.json(
      { message: 'Unable to reach auth service. Please try again.' },
      { status: 502 }
    )
  }
}
