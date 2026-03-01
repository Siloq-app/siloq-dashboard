/**
 * Backend health monitoring utilities
 */

export interface BackendHealthStatus {
  isHealthy: boolean;
  latency?: number;
  error?: string;
  lastChecked: Date;
}

const HEALTH_CACHE_KEY = 'backend_health_status';
const HEALTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check backend health with caching
 */
export async function checkBackendHealth(): Promise<BackendHealthStatus> {
  const now = new Date();

  // Check cache first
  const cached = getCachedHealthStatus();
  if (cached && now.getTime() - cached.lastChecked.getTime() < HEALTH_CACHE_DURATION) {
    return cached;
  }

  const status = await performHealthCheck();
  cacheHealthStatus(status);
  return status;
}

/**
 * Perform actual health check
 */
async function performHealthCheck(): Promise<BackendHealthStatus> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for health check

    const response = await fetch('/api/v1/auth/me/', {
      method: 'HEAD', // Use HEAD to be lightweight
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    if (response.ok || response.status === 401 || response.status === 403) {
      // 401/403 are expected without auth, means backend is responding
      return {
        isHealthy: true,
        latency,
        lastChecked: new Date(),
      };
    }

    // Handle specific error statuses
    if (response.status === 502) {
      return {
        isHealthy: false,
        latency,
        error: 'Backend service temporarily unavailable (502 Bad Gateway)',
        lastChecked: new Date(),
      };
    }

    if (response.status === 503) {
      return {
        isHealthy: false,
        latency,
        error: 'Backend service temporarily unavailable (503 Service Unavailable)',
        lastChecked: new Date(),
      };
    }

    if (response.status === 504) {
      return {
        isHealthy: false,
        latency,
        error: 'Backend service timeout (504 Gateway Timeout)',
        lastChecked: new Date(),
      };
    }

    return {
      isHealthy: false,
      latency,
      error: `HTTP ${response.status}: ${response.statusText}`,
      lastChecked: new Date(),
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;

    if (error.name === 'AbortError') {
      return {
        isHealthy: false,
        latency,
        error: 'Request timeout',
        lastChecked: new Date(),
      };
    } else if (error.code === 'ECONNREFUSED') {
      return {
        isHealthy: false,
        latency,
        error: 'Connection refused',
        lastChecked: new Date(),
      };
    } else if (error.code === 'ENOTFOUND') {
      return {
        isHealthy: false,
        latency,
        error: 'Host not found',
        lastChecked: new Date(),
      };
    } else {
      const errorMessage = error.message || 'Network error';
      return {
        isHealthy: false,
        latency,
        error: errorMessage,
        lastChecked: new Date(),
      };
    }
  }
}

/**
 * Get cached health status
 */
function getCachedHealthStatus(): BackendHealthStatus | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(HEALTH_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached);
    return {
      ...data,
      lastChecked: new Date(data.lastChecked),
    };
  } catch {
    return null;
  }
}

/**
 * Cache health status
 */
function cacheHealthStatus(status: BackendHealthStatus): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(HEALTH_CACHE_KEY, JSON.stringify(status));
  } catch {
    // Ignore cache errors
  }
}

/**
 * Clear health cache
 */
export function clearHealthCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HEALTH_CACHE_KEY);
}

/**
 * Get backend status for UI display
 */
export function getBackendStatusForUI(status: BackendHealthStatus): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  color: string;
} {
  if (status.isHealthy) {
    if (status.latency && status.latency > 2000) {
      return {
        status: 'degraded',
        message: 'Backend responding slowly',
        color: 'text-yellow-600',
      };
    }
    return {
      status: 'healthy',
      message: 'Backend operational',
      color: 'text-green-600',
    };
  }

  return {
    status: 'unhealthy',
    message: status.error || 'Backend unavailable',
    color: 'text-red-600',
  };
}
