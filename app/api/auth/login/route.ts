import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[API Route] Login request:', { email: body.email });
    console.log('[API Route] Backend URL:', BACKEND_URL);

    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log('[API Route] Login response:', { status: response.status, ok: response.ok });

    // Return the response with the same status and data
    return NextResponse.json(data, {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    console.error('[API Route] Login error:', error);
    console.error('[API Route] Backend URL:', BACKEND_URL);
    console.error('[API Route] Error details:', error instanceof Error ? error.message : 'Unknown error');

    // Check if it's a connection error
    if (error instanceof Error && 
        (error.message.includes('ECONNREFUSED') || 
         error.message.includes('fetch failed'))) {
      return NextResponse.json(
        {
          error: 'Backend unavailable',
          message: 'The backend server is not running or not accessible',
          backend_url: BACKEND_URL,
          suggestion: 'Please ensure the backend server is running on the configured port',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Login failed',
        message: 'Unable to connect to the backend server',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
