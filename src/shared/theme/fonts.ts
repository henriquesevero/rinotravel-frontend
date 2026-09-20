/**
 * One typeface for the whole app. React Native cannot pick a weight out of a custom font, so each
 * weight is its own family; `Text` resolves the weight it is given to the matching one, and nothing
 * else is allowed to set `fontWeight` on real text.
 */
export const FONT_FAMILY = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export function fontFamilyFor(weight: string | number | undefined): string {
  const value = typeof weight === 'string' ? weight.toLowerCase() : String(weight ?? '400');
  if (value === 'bold' || value === '700' || value === '800' || value === '900') {
    return FONT_FAMILY.bold;
  }
  if (value === '600') return FONT_FAMILY.semibold;
  if (value === '500') return FONT_FAMILY.medium;
  return FONT_FAMILY.regular;
}
