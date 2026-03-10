/**
 * API client for WordPress plugin using API key authentication
 */

// Store original fetch to avoid infinite loops (lazy init for SSR compatibility)
const getOriginalFetch = () => typeof window !== 'undefined' ? window.fetch.bind(window) : fetch;

export async function fetchWithApiKey(url: string, options: RequestInit = {}) {
  // Get API key from WordPress plugin config
  if (typeof window === 'undefined') {
    throw new Error('Cannot access localStorage on server side');
  }
  
  // AGGRESSIVELY clear all possible auth tokens
  const keysToRemove = ['token', 'refresh_token', 'auth_token', 'access_token', 'jwt_token'];
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  const config = localStorage.getItem('wp_plugin_demo_config');
  if (!config) {
    throw new Error('No API key configured');
  }
  
  const { apiKey } = JSON.parse(config);
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  // Merge with additional headers if provided
  const finalHeaders = options.headers 
    ? { ...headers, ...options.headers }
    : headers;

  const fullUrl = `http://localhost:8000${url}`;
  
  console.log('=== WordPress Plugin API Request ===');
  console.log('URL:', fullUrl);
  console.log('Method:', options.method || 'GET');
  console.log('Headers:', {
    ...headers,
    Authorization: `Bearer ${apiKey.substring(0, 20)}...`
  });
  console.log('Body:', options.body);
  console.log('LocalStorage before:', {
    token: localStorage.getItem('token'),
    refresh_token: localStorage.getItem('refresh_token'),
    auth_token: localStorage.getItem('auth_token')
  });
  console.log('=====================================');

  // Override fetch to ensure no interceptors
  const response = await getOriginalFetch()(fullUrl, {
    ...options,
    headers: finalHeaders,
    // Ensure no credentials are sent
    credentials: 'omit',
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('API Error Response:', error);
    
    // If it's a JWT error, show more info
    if (error.detail && error.detail.includes('token')) {
      console.error('JWT Token Error Detected!');
      console.error('This suggests a JWT token is being sent instead of API key');
      console.error('Check browser network tab for actual headers being sent');
    }
    
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('API Success Response:', data);
  return data;
}
