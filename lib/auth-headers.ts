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

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  const auth = getAuthHeaders();
  if (auth.Authorization) {
    headers.set('Authorization', auth.Authorization);
  }
  return fetch(url, { ...options, headers });
}
