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
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F6',
  border: '#E2E7EE',
  scrim: 'rgba(15, 23, 42, 0.4)',

  text: '#0F172A',
  textSecondary: '#5A6779',
  textOnAccent: '#FFFFFF',

  /** Solid fill for primary buttons; `textOnAccent` is readable on top of it. */
  accent: '#2563EB',
  accentPressed: '#1D4ED8',
  accentText: '#2563EB',
  accentSoft: '#EAF1FE',

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
  // A midnight blue rather than black: the page is the deepest layer and cards sit visibly above it.
  background: '#172033',
  surface: '#212C43',
  surfaceMuted: '#2C3956',
  border: '#3A4869',
  scrim: 'rgba(5, 9, 20, 0.6)',

  text: '#E8EDF6',
  textSecondary: '#A3AFC5',
  textOnAccent: '#FFFFFF',

  // A touch brighter than in the light theme so buttons stand out from the lighter cards (3:1) while
  // white text on them still passes.
  accent: '#2F6FEC',
  accentPressed: '#4681F2',
  accentText: '#8DB4FF',
  accentSoft: '#223B78',

  success: '#22C55E',
  successText: '#5BDC8B',
  successSoft: '#153426',

  warning: '#F59E0B',
  warningText: '#FBBF24',
  warningSoft: '#3A2D12',

  danger: '#E02D2D',
  dangerText: '#F98B8B',
  dangerSoft: '#452127',

  ai: '#8B5CF6',
  aiText: '#B4A0FB',
  aiSoft: '#2F2657',
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
    card: '0 1px 2px rgba(15, 23, 42, 0.05), 0 4px 16px rgba(15, 23, 42, 0.05)',
    raised: '0 2px 4px rgba(15, 23, 42, 0.06), 0 12px 28px rgba(15, 23, 42, 0.10)',
    sheet: '0 -8px 32px rgba(15, 23, 42, 0.16)',
  },
  dark: {
    card: '0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 6px 18px rgba(3, 7, 18, 0.28)',
    raised: '0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 12px 32px rgba(3, 7, 18, 0.45)',
    sheet: '0 -8px 32px rgba(3, 7, 18, 0.5)',
  },
} as const;

/** Widest a content column grows: comfortable reading on phones, room for grids beside a sidebar. */
export const contentMaxWidth = 640;
export const contentMaxWidthExpanded = 1080;
