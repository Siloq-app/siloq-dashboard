import { NextRequest, NextResponse } from 'next/server'

// In-memory token blacklist for demo (use Redis in production)
const tokenBlacklist: Set<string> = new Set()

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (token) {
      // Add token to blacklist
      tokenBlacklist.add(token)
    }
    
    return NextResponse.json({
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper to check if token is blacklisted
export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token)
}
