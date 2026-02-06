/**
 * Siloq Django backend API base URL.
 * Used by Next.js API routes to proxy auth and other requests.
 */
export function getBackendApiUrl(): string {
  const url = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
  return url.replace(/\/+$/, '')
}

export const AUTH_ENDPOINTS = {
  login: () => `${getBackendApiUrl()}/api/v1/auth/login/`,
  register: () => `${getBackendApiUrl()}/api/v1/auth/register/`,
  logout: () => `${getBackendApiUrl()}/api/v1/auth/logout/`,
  me: () => `${getBackendApiUrl()}/api/v1/auth/me/`,
} as const

export const SITES_ENDPOINTS = {
  list: () => `${getBackendApiUrl()}/api/v1/sites/`,
  detail: (id: number | string) => `${getBackendApiUrl()}/api/v1/sites/${id}/`,
}

export const API_KEYS_ENDPOINTS = {
  list: (siteId?: number | string) =>
    siteId
      ? `${getBackendApiUrl()}/api/v1/api-keys/?site_id=${siteId}`
      : `${getBackendApiUrl()}/api/v1/api-keys/`,
  create: () => `${getBackendApiUrl()}/api/v1/api-keys/`,
  delete: (id: number | string) => `${getBackendApiUrl()}/api/v1/api-keys/${id}/`,
}
