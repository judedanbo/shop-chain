import type { LucideIcon } from 'lucide-react';

export interface ThemeColors {
  id: string;
  name: string;
  icon: LucideIcon;
  isDark: boolean;
  preview: [string, string, string];
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderLight: string;
  text: string;
  textMuted: string;
  textDim: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string;
  accent: string;
  accentBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  orange: string;
  orangeBg: string;
}

export type ThemeId = 'midnight' | 'light' | 'ocean' | 'forest' | 'sunset' | 'lavender';

export type ThemesMap = Record<ThemeId, ThemeColors>;

export interface ThemeContextValue {
  theme: ThemeId;
  colors: ThemeColors;
  setTheme: (theme: ThemeId) => void;
  themes: ThemesMap;
  isDark: boolean;
}
