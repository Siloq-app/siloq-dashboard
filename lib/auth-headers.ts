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
  return p === '/auth/login' || p === '/login' || p.startsWith('/auth/register') || p.startsWith('/auth/forgot');
}

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

const BACKEND_URL = (
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://api.siloq.ai')
    : (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.siloq.ai')
).replace(/\/+$/, '');

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  const auth = getAuthHeaders();
  if (auth.Authorization) {
    headers.set('Authorization', auth.Authorization);
  }
  // Prepend backend URL for relative API paths
  let fullUrl = url.startsWith('/api/v1') ? `${BACKEND_URL}${url}` : url;
  // Ensure trailing slash for Django compatibility
  if (fullUrl.includes('/api/v1') && !fullUrl.endsWith('/') && !fullUrl.includes('?')) {
    fullUrl += '/';
  } else if (fullUrl.includes('/api/v1') && fullUrl.includes('?') && !fullUrl.split('?')[0].endsWith('/')) {
    const [path, query] = fullUrl.split('?');
    fullUrl = `${path}/?${query}`;
  }
  const response = await fetch(fullUrl, { ...options, headers });

  // JWT expired or forbidden: clear auth and send user to login (avoids "No sites available")
  if (typeof window !== 'undefined' && (response.status === 401 || response.status === 403) && !isAuthPage()) {
    clearAuthAndRedirectToLogin();
  }

  return response;
}
