import { NextRequest, NextResponse } from 'next/server'

// In production, this would send an actual email
const passwordResetTokens: Map<string, { email: string; expires: Date }> = new Map()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // In production: Check if user exists, generate token, send email
    // For demo, just simulate success
    const token = `reset_${Date.now()}`
    passwordResetTokens.set(token, {
      email,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    })

    console.log(`[DEV] Password reset link for ${email}: /auth/reset-password?token=${token}`)

    return NextResponse.json({
      message: 'Password reset email sent'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
