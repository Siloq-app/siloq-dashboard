import { NextRequest, NextResponse } from 'next/server'

// In-memory storage reference (should be shared with route.ts)
const apiKeys: Map<string, any[]> = new Map()

// DELETE - Revoke an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const { keyId } = params
    
    if (!keyId) {
      return NextResponse.json(
        { message: 'Key ID is required' },
        { status: 400 }
      )
    }
    
    // In production, extract userId from JWT token
    const userId = 'user_001' // Demo user
    
    const userKeys = apiKeys.get(userId) || []
    const keyIndex = userKeys.findIndex(k => k.id === keyId)
    
    if (keyIndex === -1) {
      return NextResponse.json(
        { message: 'API key not found' },
        { status: 404 }
      )
    }
    
    // Soft delete - mark as inactive
    userKeys[keyIndex].isActive = false
    apiKeys.set(userId, userKeys)
    
    return NextResponse.json({
      message: 'API key revoked successfully'
    })
  } catch (error) {
    console.error('Revoke API key error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
