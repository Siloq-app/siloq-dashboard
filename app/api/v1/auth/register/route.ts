import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for demo purposes
// In production, this would connect to a real database
const users: Map<string, { id: string; name: string; email: string; password: string }> = new Map()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    if (users.has(email)) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Create new user
    const userId = `user_${Date.now()}`
    users.set(email, {
      id: userId,
      name,
      email,
      password, // In production, this should be hashed
    })

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        name,
        email,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
