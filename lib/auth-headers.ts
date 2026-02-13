/**
 * Client-side auth headers for API calls.
 * Token is read from localStorage (set after login).
 */
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
  const fullUrl = url.startsWith('/api/v1') ? `${BACKEND_URL}${url}` : url;
  return fetch(fullUrl, { ...options, headers });
}
