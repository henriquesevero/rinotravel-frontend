/** One colour per day of a trip, repeating after eight; the server uses the same list for pictures. */
export const DAY_COLORS = [
  '#2563EB',
  '#F97316',
  '#16A34A',
  '#7C3AED',
  '#DB2777',
  '#0D9488',
  '#D97706',
  '#DC2626',
] as const;

export function dayColor(dayIndex: number): string {
  return DAY_COLORS[dayIndex % DAY_COLORS.length] ?? DAY_COLORS[0];
}
