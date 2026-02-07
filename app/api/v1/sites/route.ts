import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl, SITES_ENDPOINTS } from '@/lib/backend-api'

function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get('authorization')
}

export async function GET(request: NextRequest) {
  const auth = getAuthHeader(request)
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const res = await fetch(SITES_ENDPOINTS.list(), {
      headers: { Authorization: auth, Accept: 'application/json' },
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('Sites list proxy error:', e)
    return NextResponse.json(
      { message: 'Unable to reach backend' },
      { status: 502 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = getAuthHeader(request)
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const res = await fetch(SITES_ENDPOINTS.list(), {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    console.error('Sites create proxy error:', e)
    return NextResponse.json(
      { message: 'Unable to reach backend' },
      { status: 502 }
    )
  }
}
