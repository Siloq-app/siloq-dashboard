'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  bg: string;
  sidebar: string;
  card: string;
  cardHover: string;
  border: string;
  accent: string;
  accentHover: string;
  accentGlow: string;
  accentLight: string;
  green: string;
  greenBg: string;
  greenBorder: string;
  orange: string;
  orangeBg: string;
  orangeBorder: string;
  red: string;
  redBg: string;
  redBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;
  white: string;
  shadow: string;
  shadowHover: string;
  topbar: string;
  tableAlt: string;
  inputBg: string;
  consoleBar: string;
}

const themes: Record<ThemeMode, Theme> = {
  light: {
    bg: "#f5f6fa",
    sidebar: "#ffffff",
    card: "#ffffff",
    cardHover: "#f8f9fc",
    border: "#e2e4eb",
    accent: "#6C63FF",
    accentHover: "#5B52EE",
    accentGlow: "rgba(108,99,255,0.08)",
    accentLight: "rgba(108,99,255,0.06)",
    green: "#16a34a",
    greenBg: "rgba(22,163,74,0.06)",
    greenBorder: "rgba(22,163,74,0.2)",
    orange: "#d97706",
    orangeBg: "rgba(217,119,6,0.06)",
    orangeBorder: "rgba(217,119,6,0.2)",
    red: "#dc2626",
    redBg: "rgba(220,38,38,0.05)",
    redBorder: "rgba(220,38,38,0.2)",
    text: "#1e1e2e",
    textSecondary: "#4a4a5a",
    textMuted: "#6b7080",
    textDim: "#9ca3b0",
    white: "#ffffff",
    shadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    shadowHover: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
    topbar: "#ffffff",
    tableAlt: "#fafbfd",
    inputBg: "#ffffff",
    consoleBar: "#f0f1f5",
  },
  dark: {
    bg: "#0f1117",
    sidebar: "#141620",
    card: "#1a1d2e",
    cardHover: "#1f2336",
    border: "#2a2d3e",
    accent: "#6C63FF",
    accentHover: "#7B73FF",
    accentGlow: "rgba(108,99,255,0.15)",
    accentLight: "rgba(108,99,255,0.1)",
    green: "#22c55e",
    greenBg: "rgba(34,197,94,0.1)",
    greenBorder: "rgba(34,197,94,0.25)",
    orange: "#f59e0b",
    orangeBg: "rgba(245,158,11,0.1)",
    orangeBorder: "rgba(245,158,11,0.25)",
    red: "#ef4444",
    redBg: "rgba(239,68,68,0.08)",
    redBorder: "rgba(239,68,68,0.3)",
    text: "#e4e4e7",
    textSecondary: "#c4c4cc",
    textMuted: "#71717a",
    textDim: "#52525b",
    white: "#ffffff",
    shadow: "0 1px 3px rgba(0,0,0,0.3)",
    shadowHover: "0 4px 12px rgba(0,0,0,0.4)",
    topbar: "#141620",
    tableAlt: "#141822",
    inputBg: "#0f1117",
    consoleBar: "#111322",
  }
};

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('siloq-theme') as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') {
      setModeState(stored);
    }
    setMounted(true);
  }, []);

  // Update localStorage and HTML attribute when mode changes
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('siloq-theme', mode);
    document.documentElement.setAttribute('data-theme', mode);
    // Also toggle Tailwind dark class for dark: prefixed styles
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode, mounted]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const theme = themes[mode];

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
