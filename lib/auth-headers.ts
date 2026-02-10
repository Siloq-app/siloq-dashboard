/**
 * Client-side auth headers for API calls.
 * Token is read from localStorage (set after login).
 */

const API_BASE_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://api.siloq.ai')
  : 'https://api.siloq.ai'

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('token')
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers)
  const auth = getAuthHeaders()
  if (auth.Authorization) {
    headers.set('Authorization', auth.Authorization)
  }
  
  // Prepend API base URL if the URL is relative (starts with /)
  const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url
  
  return fetch(fullUrl, { ...options, headers })
}
