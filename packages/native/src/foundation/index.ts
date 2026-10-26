import { InjectionToken, type Signal } from '@angular/core';
export type NeuSize = 'sm' | 'md' | 'lg';
export type NeuVariant = 'solid' | 'tonal' | 'outline' | 'text';
export type NeuTone = 'neutral' | 'brand' | 'accent' | 'success' | 'info' | 'warning' | 'danger';
export type NeuColorScheme = 'system' | 'light' | 'dark';
export interface NeuTokens {
  accent: string;
  onAccent: string;
  surface: string;
  canvas: string;
  text: string;
  muted: string;
  border: string;
  tonal: string;
  danger: string;
  success: string;
  warning: string;
  warningText: string;
  onWarning: string;
  info: string;
  /** Optional semantic text inks; defaults are resolved against the theme surfaces. */
  accentText?: string;
  dangerText?: string;
  successText?: string;
  infoText?: string;
  radius: number;
  spacing: number;
  fontSize: number;
  duration: number;
  /** Decorative surfaces; independent of the functional control border. */
  surfaceBorder?: string;
  divider?: string;
  surfaceSecondary?: string;
  /** Dedicated image canvas and readable control ink, independent of app scheme. */
  mediaCanvas?: string;
  mediaText?: string;
  mediaBarStyle?: 'light' | 'dark';
}
export const NEU_LIGHT_TOKENS: Readonly<NeuTokens> = Object.freeze({
  accent: '#006ee6',
  onAccent: '#ffffff',
  surface: '#ffffff',
  canvas: '#f4f5f7',
  text: '#172033',
  muted: '#596477',
  border: '#a5afbf',
  tonal: '#eff6ff',
  danger: '#dc2626',
  success: '#15803d',
  warning: '#f59e0b',
  warningText: '#92400e',
  onWarning: '#111827',
  info: '#0064d1',
  radius: 12,
  spacing: 16,
  fontSize: 16,
  duration: 120,
  surfaceBorder: '#e1e6ed',
  divider: '#e7ebf0',
  surfaceSecondary: '#eef1f5',
  mediaCanvas: '#111722',
  mediaText: '#edf1fa',
  mediaBarStyle: 'light',
});
export const NEU_DARK_TOKENS: Readonly<NeuTokens> = Object.freeze({
  ...NEU_LIGHT_TOKENS,
  accent: '#b5c4ff',
  onAccent: '#172955',
  surface: '#1b2230',
  canvas: '#111722',
  text: '#edf1fa',
  muted: '#b4bed0',
  border: '#6c7a92',
  tonal: '#293756',
  danger: '#ffb4ab',
  success: '#8fdeb1',
  warning: '#efd48f',
  warningText: '#efd48f',
  onWarning: '#111722',
  info: '#7dd3fc',
  surfaceBorder: '#354052',
  divider: '#303b4c',
  surfaceSecondary: '#222d3f',
});
export const NEU_THEME = new InjectionToken<Signal<Readonly<NeuTokens>>>(
  'Neural Native theme',
);
export const NEU_CHECK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4 10-10"/></svg>';
export const NEU_PLUS_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
