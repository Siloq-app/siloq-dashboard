/**
 * Client-side auth headers for API calls.
 * Token is read from localStorage (set after login).
 */

const LOGIN_PATH = '/auth/login';

/** Clear stored auth so next load goes to login. Call on 401/403. */
export function clearAuthAndRedirectToLogin(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('subscriptionTier');
  window.location.href = LOGIN_PATH;
}

/** True if current path is login/register so we don't redirect in a loop. */
function isAuthPage(): boolean {
  if (typeof window === 'undefined') return true;
  const p = window.location.pathname;
  return (
    p === '/auth/login' ||
    p === '/login' ||
    p.startsWith('/auth/register') ||
    p.startsWith('/auth/forgot')
  );
}

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

const BACKEND_URL = (
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      'http://localhost:8001'
    : process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      'http://localhost:8001'
).replace(/\/+$/, '');

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  retries: number = 1 // Reduced retries to avoid interference
): Promise<Response> {
  const headers = new Headers(options.headers);
  const auth = getAuthHeaders();
  if (auth.Authorization) {
    headers.set('Authorization', auth.Authorization);
  }
  // Prepend backend URL for relative API paths
  let fullUrl = url.startsWith('/api/v1') ? `/api/proxy${url}` : url;
  // Ensure trailing slash for Django compatibility
  if (fullUrl.includes('/api/v1') && !fullUrl.endsWith('/') && !fullUrl.includes('?')) {
    fullUrl += '/';
  } else if (
    fullUrl.includes('/api/v1') &&
    fullUrl.includes('?') &&
    !fullUrl.split('?')[0].endsWith('/')
  ) {
    const [path, query] = fullUrl.split('?');
    fullUrl = `${path}/?${query}`;
  }

  // Add debugging for URL construction
  console.log(`[fetchWithAuth] Original URL: ${url}`);
  console.log(`[fetchWithAuth] Backend URL: ${BACKEND_URL}`);
  console.log(`[fetchWithAuth] Full URL: ${fullUrl}`);
  console.log(`[fetchWithAuth] Has auth: ${!!auth.Authorization}`);

  // Early check for obvious backend unavailability
  if (fullUrl.includes('/api/proxy')) {
    // For proxy URLs, do a quick connectivity check first
    let testTimeoutId: NodeJS.Timeout | undefined;
    try {
      // Just try to fetch with a very short timeout to check connectivity
      const testController = new AbortController();
      testTimeoutId = setTimeout(() => testController.abort(), 500); // Reduced timeout for faster feedback

      await fetch(fullUrl, {
        method: 'HEAD',
        signal: testController.signal,
      });
      clearTimeout(testTimeoutId);
    } catch {
      // If the quick test fails, we know the backend is not available
      console.log(
        `[fetchWithAuth] Backend connectivity check failed, returning mock error response`
      );
      if (testTimeoutId) {
        clearTimeout(testTimeoutId);
      }

      const errorResponse = new Response(
        JSON.stringify({
          error: 'Network error',
          message: 'Backend server is not running or not accessible',
          error_code: 'CONNECTION_REFUSED',
          details: `The backend server at ${BACKEND_URL} could not be reached. Please ensure the backend server is running on port 8001.`,
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      return errorResponse;
    }
  }

  // Retry logic for network errors only
  for (let attempt = 0; attempt <= retries; attempt++) {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced timeout

    let response: Response;
    try {
      // Add additional debugging for network issues
      console.log(`[fetchWithAuth] Attempt ${attempt + 1}/${retries + 1}: Fetching ${fullUrl}`);

      response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      console.log(`[fetchWithAuth] Response received: ${response.status} ${response.statusText}`);

      // JWT expired or forbidden: clear auth and send user to login (avoids "No sites available")
      if (
        typeof window !== 'undefined' &&
        (response.status === 401 || response.status === 403) &&
        !isAuthPage()
      ) {
        console.log(
          `[fetchWithAuth] Auth error (${response.status}), clearing auth and redirecting to login`
        );
        clearAuthAndRedirectToLogin();
      }

      // If we get a response, return it (even if it's an error response)
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // If this is the last attempt, handle the error
      if (attempt === retries) {
        console.error(`[fetchWithAuth] All ${retries + 1} attempts failed for ${fullUrl}:`, error);

        // Handle network errors (backend unreachable, CORS issues, timeout, etc.)
        let errorMessage = 'Unable to connect to the backend server';
        let errorCode = 'NETWORK_ERROR';

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = 'Request timed out - the server took too long to respond';
            errorCode = 'TIMEOUT_ERROR';
          } else if (
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('Failed to fetch')
          ) {
            errorMessage = 'Backend server is not running or not accessible';
            errorCode = 'CONNECTION_REFUSED';
          } else if (error.message.includes('ENOTFOUND')) {
            errorMessage = 'Backend server hostname could not be resolved';
            errorCode = 'HOST_NOT_FOUND';
          } else if (error.message.includes('CORS')) {
            errorMessage = 'CORS policy blocked the request - check backend CORS configuration';
            errorCode = 'CORS_ERROR';
          }
        }

        // Create a mock error response with proper error structure
        const errorResponse = new Response(
          JSON.stringify({
            error: 'Network error',
            message: errorMessage,
            error_code: errorCode,
            details: error instanceof Error ? error.message : 'Unknown network error',
          }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        console.log(`[fetchWithAuth] Returning error response: ${errorCode}`);
        return errorResponse;
      } else {
        // Wait before retrying (shorter delay)
        const delay = 500;
        console.log(`[fetchWithAuth] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Unexpected error in fetchWithAuth');
}
