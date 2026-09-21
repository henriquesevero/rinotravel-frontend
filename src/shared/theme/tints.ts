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
  slate: { bg: '#E8ECF2', fg: '#475569' },
};

export const darkTints: Record<Tint, TintColors> = {
  blue: { bg: '#223B78', fg: '#9DBBFF' },
  sky: { bg: '#123349', fg: '#7DD3FC' },
  indigo: { bg: '#27295F', fg: '#B4BEFD' },
  violet: { bg: '#2F2657', fg: '#C9BBFD' },
  pink: { bg: '#43213A', fg: '#F9A8D4' },
  orange: { bg: '#43291A', fg: '#FDBA74' },
  amber: { bg: '#3A2D12', fg: '#FCD34D' },
  green: { bg: '#153426', fg: '#86EFAC' },
  teal: { bg: '#12363A', fg: '#5EEAD4' },
  slate: { bg: '#33415F', fg: '#CBD5E1' },
};

export function tintColors(scheme: 'light' | 'dark', tint: Tint): TintColors {
  return (scheme === 'dark' ? darkTints : lightTints)[tint];
}
