'use client';

import { ThemeProvider } from '@/lib/hooks/theme-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
