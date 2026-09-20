import { darkColors, lightColors, type ThemeColors } from './tokens';

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter! + 0.05) / (darker! + 0.05);
}

const AA_TEXT = 4.5;

type TextPair = [foreground: keyof ThemeColors, background: keyof ThemeColors];

const textPairs: TextPair[] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['text', 'surfaceMuted'],
  ['textSecondary', 'background'],
  ['textSecondary', 'surface'],
  ['textSecondary', 'surfaceMuted'],
  ['textOnAccent', 'accent'],
  ['textOnAccent', 'danger'],
  ['accentText', 'background'],
  ['accentText', 'surface'],
  ['accentText', 'accentSoft'],
  ['successText', 'background'],
  ['successText', 'surface'],
  ['successText', 'successSoft'],
  ['warningText', 'background'],
  ['warningText', 'surface'],
  ['warningText', 'warningSoft'],
  ['dangerText', 'background'],
  ['dangerText', 'surface'],
  ['dangerText', 'dangerSoft'],
  ['aiText', 'background'],
  ['aiText', 'surface'],
  ['aiText', 'aiSoft'],
];

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
] as const)('%s theme', (_name, colors) => {
  it.each(textPairs)('%s on %s meets WCAG AA for body text', (foreground, background) => {
    expect(contrast(colors[foreground], colors[background])).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('keeps non-text accents distinguishable from the surface (WCAG 3:1)', () => {
    for (const fill of ['accent', 'danger'] as const) {
      expect(contrast(colors[fill], colors.surface)).toBeGreaterThanOrEqual(3);
    }
  });
});

it('defines every token in both themes', () => {
  expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
});
