/**
 * Client-side auth headers for API calls.
 * Token is read from localStorage (set after login).
 */
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  console.log('Auth Headers - Token exists:', !!token);
  console.log('Auth Headers - Token length:', token?.length || 0);
  console.log('Auth Headers - Token prefix:', token?.substring(0, 20) || 'none');
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
  
  console.log('=== Dashboard API Request ===');
  console.log('URL:', url);
  console.log('Headers:', Object.fromEntries(headers.entries()));
  console.log('==========================');
  
  return fetch(url, { ...options, headers });
}
