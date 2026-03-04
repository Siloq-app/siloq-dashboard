import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header from the request
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header provided' }, { status: 401 });
    }

    console.log('[API Route] Auth me request');

    // Forward the request to the backend with the auth header
    let response;
    try {
      response = await fetch(`${BACKEND_URL}/api/v1/auth/me/`, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Handle backend connection errors
      if (error instanceof Error && error.cause && (error.cause as any).code === 'ECONNREFUSED') {
        console.error('[API Route] Auth me error: Backend connection refused', {
          url: `${BACKEND_URL}/api/v1/auth/me/`,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json(
          { 
            error: 'Backend server unavailable',
            message: 'Unable to connect to the backend server. Please ensure the backend is running on port 8000.',
            code: 'BACKEND_CONNECTION_REFUSED'
          },
          { status: 503 }
        );
      }
      
      console.error('[API Route] Auth me error:', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        {
          error: 'Authentication check failed',
          message: 'Unable to connect to the backend server',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 503 }
      );
    }

    const data = await response.json();

    console.log('[API Route] Auth me response:', { status: response.status, ok: response.ok });

    // Return the response with the same status and data
    return NextResponse.json(data, {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    console.error('[API Route] Auth me error:', error);

    return NextResponse.json(
      {
        error: 'Authentication check failed',
        message: 'Unable to connect to the backend server',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
