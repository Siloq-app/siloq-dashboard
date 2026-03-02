import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[API Route] Register request:', { email: body.email, name: body.name });

    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log('[API Route] Register response:', { status: response.status, ok: response.ok });

    // Return the response with the same status and data
    return NextResponse.json(data, {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    console.error('[API Route] Register error:', error);

    return NextResponse.json(
      {
        error: 'Registration failed',
        message: 'Unable to connect to the backend server',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
