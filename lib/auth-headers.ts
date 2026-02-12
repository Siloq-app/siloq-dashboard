/**
 * Client-side auth headers for API calls.
 * Token is read from localStorage (set after login).
 */

// Always use the production API URL - NEVER localhost
const API_BASE_URL = 'https://api.siloq.ai'

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
  // Always include Accept: application/json
  headers.set('Accept', 'application/json')
  
  // Prepend API base URL if the URL is relative (starts with /)
  const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[fetchWithAuth] Calling:', fullUrl)
  }
  
  return fetch(fullUrl, { ...options, headers })
}
