'use client';

import { ThemeProvider } from '@/lib/hooks/theme-context';
import { useEffect } from 'react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle unhandled promise rejections that might cause [object Event] errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Prevent the default browser error handling
      event.preventDefault();
    };

    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error || event.message);
      // Prevent the default browser error handling
      event.preventDefault();
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <ThemeProvider>{children}</ThemeProvider>;
}
