/**
 * Backend Health Check Utility
 * Provides utilities to check backend connectivity and health status
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

export interface BackendHealthStatus {
  isHealthy: boolean;
  url: string;
  error?: string;
  responseTime?: number;
  timestamp: string;
}

/**
 * Check if the backend server is running and accessible
 */
export async function checkBackendHealth(): Promise<BackendHealthStatus> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${BACKEND_URL}/api/v1/health/`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      isHealthy: response.ok,
      url: BACKEND_URL,
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Connection timeout';
      } else if (error.cause && (error.cause as any).code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused - backend server is not running';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      isHealthy: false,
      url: BACKEND_URL,
      error: errorMessage,
      responseTime,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get a user-friendly message based on backend health status
 */
export function getBackendHealthMessage(status: BackendHealthStatus): string {
  if (status.isHealthy) {
    return `Backend is healthy (${status.responseTime}ms)`;
  }

  switch (status.error) {
    case 'Connection timeout':
      return 'Backend server is not responding (timeout)';
    case 'Connection refused - backend server is not running':
      return 'Backend server is not running on port 8000';
    default:
      return `Backend connection failed: ${status.error}`;
  }
}

/**
 * Hook-like function to periodically check backend health
 */
export function createBackendHealthChecker(interval: number = 30000) {
  let lastStatus: BackendHealthStatus | null = null;
  let intervalId: NodeJS.Timeout | null = null;

  const start = () => {
    if (intervalId) return;

    // Check immediately
    checkStatus();

    // Then check periodically
    intervalId = setInterval(checkStatus, interval);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const checkStatus = async () => {
    lastStatus = await checkBackendHealth();
    return lastStatus;
  };

  const getStatus = () => lastStatus;

  return {
    start,
    stop,
    checkStatus,
    getStatus,
  };
}
