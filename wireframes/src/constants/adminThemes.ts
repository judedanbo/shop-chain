/**
 * Admin portal theme definitions.
 *
 * When the admin portal is active, `syncAdminCssVars()` pushes these
 * colors onto the same `--sc-*` CSS custom properties used by the
 * main app, so Tailwind semantic classes (`bg-surface`, `text-primary`,
 * `border-border`, etc.) reflect admin theme colors.
 */

import type { ThemeColors } from '@/types';

export interface AdminThemeColors {
  isDark: boolean;
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
  adminAccent: string;
}

export type AdminThemeId = 'dark' | 'light';

export const ADMIN_THEMES: Record<AdminThemeId, AdminThemeColors> = {
  dark: {
    isDark: true,
    bg: '#0A0F1C',
    surface: '#111827',
    surfaceAlt: '#1A2236',
    border: '#1F2B45',
    borderLight: '#2A3855',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    textDim: '#64748B',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    primaryBg: '#6366F115',
    accent: '#06B6D4',
    accentBg: '#06B6D415',
    success: '#10B981',
    successBg: '#10B98115',
    warning: '#F59E0B',
    warningBg: '#F59E0B15',
    danger: '#EF4444',
    dangerBg: '#EF444415',
    orange: '#F39C12',
    orangeBg: '#F39C1215',
    adminAccent: '#6366F1',
  },
  light: {
    isDark: false,
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    border: '#E2E8F0',
    borderLight: '#CBD5E1',
    text: '#0F172A',
    textMuted: '#64748B',
    textDim: '#94A3B8',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    primaryBg: '#6366F110',
    accent: '#06B6D4',
    accentBg: '#06B6D410',
    success: '#10B981',
    successBg: '#10B98110',
    warning: '#F59E0B',
    warningBg: '#F59E0B10',
    danger: '#EF4444',
    dangerBg: '#EF444410',
    orange: '#F39C12',
    orangeBg: '#F39C1210',
    adminAccent: '#6366F1',
  },
};

/** Sync a color palette to CSS custom properties so Tailwind utilities work. */
export function syncAdminCssVars(colors: AdminThemeColors | ThemeColors): void {
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
