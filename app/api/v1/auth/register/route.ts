import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const users: Map<string, { id: string; name: string; email: string; password: string }> = new Map()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (users.has(email)) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      )
    }

    const userId = `user_${Date.now()}`
    const hashedPassword = await bcrypt.hash(password, 10)

    users.set(email, {
      id: userId,
      name,
      email,
      password: hashedPassword
    })

    const token = jwt.sign(
      { userId, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        name,
        email
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
