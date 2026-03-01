import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8001';

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE');
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request, 'PATCH');
}

async function handleRequest(request: NextRequest, method: string) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Remove 'api' and 'proxy' from path to get the actual backend path
    const apiPathIndex = pathSegments.findIndex((segment) => segment === 'api');
    const proxyPathIndex = pathSegments.findIndex((segment) => segment === 'proxy');

    let backendPath = '';
    if (apiPathIndex !== -1 && proxyPathIndex !== -1 && proxyPathIndex > apiPathIndex) {
      // Remove everything up to and including 'proxy'
      backendPath = '/' + pathSegments.slice(proxyPathIndex + 1).join('/');
    } else {
      // Fallback: just join all segments after 'api/proxy'
      backendPath = '/' + pathSegments.slice(2).join('/');
    }

    // Ensure the path starts with /api/v1
    if (!backendPath.startsWith('/api/v1')) {
      backendPath = `/api/v1${backendPath}`;
    }

    const fullBackendUrl = `${BACKEND_URL}${backendPath}${url.search}`;

    console.log(`[API Proxy] ${method} ${backendPath} -> ${fullBackendUrl}`);

    // Get headers from the request
    const headers = new Headers();

    // Copy all headers except host
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    // Get the request body
    let body = null;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await request.text();
    }

    // Make the request to the backend
    const response = await fetch(fullBackendUrl, {
      method,
      headers,
      body,
    });

    // Get the response data
    const responseText = await response.text();

    // Copy response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
        responseHeaders.set(key, value);
      }
    });

    // Add CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log(`[API Proxy] Response: ${response.status} ${response.statusText}`);

    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[API Proxy] Error:', error);

    return NextResponse.json(
      {
        error: 'Proxy request failed',
        message: 'Unable to connect to the backend server',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
