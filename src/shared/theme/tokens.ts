export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  scrim: string;

  text: string;
  textSecondary: string;
  textOnAccent: string;

  /** Solid fill for primary buttons; `textOnAccent` is readable on top of it. */
  accent: string;
  accentPressed: string;
  /** The accent as text, icons and links on `background`/`surface`. */
  accentText: string;
  accentSoft: string;

  success: string;
  successText: string;
  successSoft: string;

  warning: string;
  warningText: string;
  warningSoft: string;

  /** Solid fill for destructive buttons; `textOnAccent` is readable on top of it. */
  danger: string;
  dangerText: string;
  dangerSoft: string;

  ai: string;
  aiText: string;
  aiSoft: string;
}

export const lightColors: ThemeColors = {
  background: '#F8F8F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F0EC',
  border: '#E5E5E5',
  scrim: 'rgba(17, 17, 17, 0.4)',

  text: '#111111',
  textSecondary: '#6B6B6B',
  textOnAccent: '#FFFFFF',

  accent: '#2563EB',
  accentPressed: '#1D4ED8',
  accentText: '#2563EB',
  accentSoft: '#EEF3FE',

  success: '#22C55E',
  successText: '#15803D',
  successSoft: '#EBF8EF',

  warning: '#F59E0B',
  warningText: '#B45309',
  warningSoft: '#FEF3DC',

  danger: '#DC2626',
  dangerText: '#B91C1C',
  dangerSoft: '#FDECEC',

  ai: '#8B5CF6',
  aiText: '#6D28D9',
  aiSoft: '#F1EBFE',
};

export const darkColors: ThemeColors = {
  background: '#0B0B0C',
  surface: '#1C1C1E',
  surfaceMuted: '#2C2C2E',
  border: '#3A3A3C',
  scrim: 'rgba(0, 0, 0, 0.6)',

  text: '#F5F5F7',
  textSecondary: '#A1A1A6',
  textOnAccent: '#FFFFFF',

  accent: '#2563EB',
  accentPressed: '#3B74F0',
  accentText: '#7AA7FF',
  accentSoft: '#172554',

  success: '#22C55E',
  successText: '#4ADE80',
  successSoft: '#0F2A1A',

  warning: '#F59E0B',
  warningText: '#FBBF24',
  warningSoft: '#33260A',

  danger: '#DC2626',
  dangerText: '#F87171',
  dangerSoft: '#3B1414',

  ai: '#8B5CF6',
  aiText: '#A78BFA',
  aiSoft: '#2A1F4D',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const motion = { fast: 120, base: 220, slow: 320 } as const;

export type TextVariant =
  'largeTitle' | 'title' | 'headline' | 'body' | 'callout' | 'subhead' | 'footnote' | 'caption';

export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  letterSpacing?: number;
}

export const typography: Record<TextVariant, TypeStyle> = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.3 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: 0.2 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
};

export const shadows = {
  light: {
    card: '0 1px 2px rgba(17, 17, 17, 0.05), 0 4px 16px rgba(17, 17, 17, 0.04)',
    sheet: '0 -8px 32px rgba(17, 17, 17, 0.16)',
  },
  dark: {
    card: '0 1px 2px rgba(0, 0, 0, 0.4)',
    sheet: '0 -8px 32px rgba(0, 0, 0, 0.5)',
  },
} as const;

/** Widest a content column grows on tablets and desktop web. */
export const contentMaxWidth = 640;
