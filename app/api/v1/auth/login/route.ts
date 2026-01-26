import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for demo purposes
// In production, this would connect to a real database
const users: Map<string, { id: string; name: string; email: string; password: string }> = new Map()

// Add a demo user for testing
users.set('demo@siloq.com', {
  id: 'user_demo',
  name: 'Demo User',
  email: 'demo@siloq.com',
  password: 'password123',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = users.get(email)
    
    if (!user || user.password !== password) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
