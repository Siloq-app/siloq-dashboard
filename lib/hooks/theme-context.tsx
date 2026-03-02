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
  gold: string;
  goldBg: string;
  goldBorder: string;
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
    bg: '#f5f6fa',
    sidebar: '#ffffff',
    card: '#ffffff',
    cardHover: '#f8f9fc',
    border: '#e2e4eb',
    accent: '#006ff9',
    accentHover: '#005acc',
    accentGlow: '#006ff914',
    accentLight: '#006ff90F',
    green: '#16a34a',
    greenBg: '#16A34A0F',
    greenBorder: '#16A34A33',
    gold: '#d97706',
    goldBg: '#D977060F',
    goldBorder: '#D9770633',
    red: '#dc2626',
    redBg: '#DC26260D',
    redBorder: '#DC262633',
    text: '#1e1e2e',
    textSecondary: '#4a4a5a',
    textMuted: '#6b7080',
    textDim: '#9ca3b0',
    white: '#ffffff',
    shadow: '0 1px 3px #0000000F, 0 1px 2px #0000000A',
    shadowHover: '0 4px 12px #00000014, 0 2px 4px #0000000A',
    topbar: '#ffffff',
    tableAlt: '#fafbfd',
    inputBg: '#ffffff',
    consoleBar: '#f0f1f5',
  },
  dark: {
    bg: '#15141B', // Base: refined dark background
    sidebar: '#15141B', // Sidebar: consistent with main background
    card: '#1A1D27', // Surface: cards, panels, modals
    cardHover: '#22263A', // Elevated: dropdowns, tooltips, hover states
    border: '#2C3050', // Borders & Dividers: subtle blue-tinted separator
    accent: '#006ff9', // Primary action: blue
    accentHover: '#005acc', // Hover: darker blue
    accentGlow: '#006ff926', // Blue glow with opacity
    accentLight: '#006ff91A', // Subtle blue tint
    green: '#3DD68C', // Success: bright green
    greenBg: '#3DD68C1A', // Success background
    greenBorder: '#3DD68C40', // Success border
    gold: '#FFD700', // Warning/attention: gold
    goldBg: '#FFD7001A', // Gold background
    goldBorder: '#FFD70040', // Gold border
    red: '#F04438', // Error: bright red
    redBg: '#F044381A', // Error background
    redBorder: '#F0443840', // Error border
    text: '#E8EAF0', // Primary: soft white, easier on eyes
    textSecondary: '#7B82A0', // Secondary: muted labels, metadata
    textMuted: '#9BA3BF', // Additional muted text
    textDim: '#454B66', // Disabled: very muted
    white: '#ffffff',
    shadow: '0 1px 3px #00000066, 0 1px 2px #0000004D',
    shadowHover: '0 4px 12px #00000080, 0 2px 4px #0000004D',
    topbar: '#1A1D27', // Topbar using surface color
    tableAlt: '#141622', // Table alternate rows
    inputBg: '#1A1D27', // Input background using surface
    consoleBar: '#111318', // Console bar using sidebar color
  },
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Prevent flash of wrong theme - render with default theme instead of null
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ mode: 'light', setMode, theme: themes.light }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return <ThemeContext.Provider value={{ mode, setMode, theme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
