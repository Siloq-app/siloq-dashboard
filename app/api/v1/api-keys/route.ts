import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// API Key structure
interface ApiKey {
  id: string
  name: string
  key: string
  keyPrefix: string
  createdAt: string
  lastUsedAt?: string
  isActive: boolean
}

// In-memory storage for demo (use database in production)
const apiKeys: Map<string, ApiKey[]> = new Map()

// Generate a secure API key
function generateApiKey(): { fullKey: string; prefix: string; hashedKey: string } {
  const prefix = 'sk_siloq'
  const randomPart = crypto.randomBytes(32).toString('hex')
  const fullKey = `${prefix}_${randomPart}`
  const hashedKey = crypto.createHash('sha256').update(fullKey).digest('hex')
  
  return { fullKey, prefix: fullKey.slice(0, 16) + '...', hashedKey }
}

// GET - List all API keys for a user
export async function GET(request: NextRequest) {
  try {
    // In production, extract userId from JWT token
    const userId = 'user_001' // Demo user
    
    const userKeys = apiKeys.get(userId) || []
    
    // Return keys without the full key (only show prefix)
    const safeKeys = userKeys.map(k => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      isActive: k.isActive
    }))
    
    return NextResponse.json({ keys: safeKeys })
  } catch (error) {
    console.error('List API keys error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Generate new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body
    
    if (!name) {
      return NextResponse.json(
        { message: 'Key name is required' },
        { status: 400 }
      )
    }
    
    // In production, extract userId from JWT token
    const userId = 'user_001' // Demo user
    
    const { fullKey, prefix, hashedKey } = generateApiKey()
    
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name,
      key: hashedKey,
      keyPrefix: prefix,
      createdAt: new Date().toISOString(),
      isActive: true
    }
    
    const userKeys = apiKeys.get(userId) || []
    userKeys.push(newKey)
    apiKeys.set(userId, userKeys)
    
    // Return the full key ONLY ONCE (it won't be retrievable again)
    return NextResponse.json({
      message: 'API key created successfully',
      key: {
        id: newKey.id,
        name: newKey.name,
        key: fullKey, // Full key shown only on creation
        keyPrefix: newKey.keyPrefix,
        createdAt: newKey.createdAt,
        isActive: newKey.isActive
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Create API key error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
