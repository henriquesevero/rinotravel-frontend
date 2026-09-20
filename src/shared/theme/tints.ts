/** Soft colour pairs for icon badges and chips: a tinted background with a readable foreground. */
export type Tint =
  'blue' | 'sky' | 'indigo' | 'violet' | 'pink' | 'orange' | 'amber' | 'green' | 'teal' | 'slate';

export interface TintColors {
  bg: string;
  fg: string;
}

export const lightTints: Record<Tint, TintColors> = {
  blue: { bg: '#E8F0FE', fg: '#1D4ED8' },
  sky: { bg: '#E0F2FE', fg: '#0369A1' },
  indigo: { bg: '#E6E9FF', fg: '#4338CA' },
  violet: { bg: '#EDE9FE', fg: '#6D28D9' },
  pink: { bg: '#FCE7F3', fg: '#BE185D' },
  orange: { bg: '#FFEDD9', fg: '#C2410C' },
  amber: { bg: '#FEF3C7', fg: '#92400E' },
  green: { bg: '#DCFCE7', fg: '#15803D' },
  teal: { bg: '#D5F5EE', fg: '#0F766E' },
  slate: { bg: '#EBEEF2', fg: '#475569' },
};

export const darkTints: Record<Tint, TintColors> = {
  blue: { bg: '#172554', fg: '#93B4FF' },
  sky: { bg: '#0C2A3D', fg: '#7DD3FC' },
  indigo: { bg: '#1E1B4B', fg: '#A5B4FC' },
  violet: { bg: '#2A1F4D', fg: '#C4B5FD' },
  pink: { bg: '#3A1027', fg: '#F9A8D4' },
  orange: { bg: '#3A1F0B', fg: '#FDBA74' },
  amber: { bg: '#33260A', fg: '#FCD34D' },
  green: { bg: '#0F2A1A', fg: '#86EFAC' },
  teal: { bg: '#0B2E2A', fg: '#5EEAD4' },
  slate: { bg: '#2C2C2E', fg: '#CBD5E1' },
};

export function tintColors(scheme: 'light' | 'dark', tint: Tint): TintColors {
  return (scheme === 'dark' ? darkTints : lightTints)[tint];
}
