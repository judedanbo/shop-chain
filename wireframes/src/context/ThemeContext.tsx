import { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from 'react';
import { THEMES, DEFAULT_THEME } from '@/constants/themes';
import type { ThemeId, ThemeColors, ThemeContextValue } from '@/types';

/** Sync theme color tokens to CSS custom properties so Tailwind utilities work. */
function syncCssVars(colors: ThemeColors) {
  const root = document.documentElement.style;
  root.setProperty('--sc-bg', colors.bg);
  root.setProperty('--sc-surface', colors.surface);
  root.setProperty('--sc-surface-alt', colors.surfaceAlt);
  root.setProperty('--sc-border', colors.border);
  root.setProperty('--sc-border-light', colors.borderLight);
  root.setProperty('--sc-text', colors.text);
  root.setProperty('--sc-text-muted', colors.textMuted);
  root.setProperty('--sc-text-dim', colors.textDim);
  root.setProperty('--sc-primary', colors.primary);
  root.setProperty('--sc-primary-light', colors.primaryLight);
  root.setProperty('--sc-primary-dark', colors.primaryDark);
  root.setProperty('--sc-primary-bg', colors.primaryBg);
  root.setProperty('--sc-accent', colors.accent);
  root.setProperty('--sc-accent-bg', colors.accentBg);
  root.setProperty('--sc-success', colors.success);
  root.setProperty('--sc-success-bg', colors.successBg);
  root.setProperty('--sc-warning', colors.warning);
  root.setProperty('--sc-warning-bg', colors.warningBg);
  root.setProperty('--sc-danger', colors.danger);
  root.setProperty('--sc-danger-bg', colors.dangerBg);
  root.setProperty('--sc-orange', colors.orange);
  root.setProperty('--sc-orange-bg', colors.orangeBg);
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeId;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shopchain-theme') as ThemeId | null;
      if (stored && THEMES[stored]) return stored;
    }
    return defaultTheme ?? DEFAULT_THEME;
  });

  const colors = useMemo<ThemeColors>(() => THEMES[themeId] ?? THEMES[DEFAULT_THEME], [themeId]);

  useEffect(() => {
    syncCssVars(colors);
  }, [colors]);

  const setTheme = useCallback((newThemeId: ThemeId) => {
    if (THEMES[newThemeId]) {
      setThemeId(newThemeId);
      localStorage.setItem('shopchain-theme', newThemeId);
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themeId,
      colors,
      setTheme,
      themes: THEMES,
      isDark: colors.isDark,
    }),
    [themeId, colors, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

export function useColors(): ThemeColors {
  const { colors } = useTheme();
  return colors;
}
