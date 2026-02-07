import { NextRequest, NextResponse } from 'next/server'
import { PAGES_ENDPOINTS } from '@/lib/backend-api'

function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get('authorization')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthHeader(request)
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    const res = await fetch(PAGES_ENDPOINTS.detail(id), {
      headers: { Authorization: auth, Accept: 'application/json' },
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('Page detail proxy error:', e)
    return NextResponse.json(
      { message: 'Unable to reach backend' },
      { status: 502 }
    )
  }
}
