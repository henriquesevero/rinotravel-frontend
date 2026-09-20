/** A calendar date as `YYYY-MM-DD`, with no time zone (matches the API's `date` fields). */
export type CivilDate = string;

export type TripPhase = 'upcoming' | 'ongoing' | 'past';

const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export interface CivilParts {
  year: number;
  month: number;
  day: number;
}

export function parseCivilDate(value: string): CivilParts | null {
  const match = PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day;
  return isReal ? { year, month, day } : null;
}

export function isCivilDate(value: string): boolean {
  return parseCivilDate(value) !== null;
}

export function compareCivilDates(a: CivilDate, b: CivilDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function toUtcMs(value: CivilDate): number {
  const parts = parseCivilDate(value);
  if (!parts) throw new RangeError(`Invalid civil date: ${value}`);
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

export function daysInclusive(start: CivilDate, end: CivilDate): number {
  return Math.round((toUtcMs(end) - toUtcMs(start)) / MS_PER_DAY) + 1;
}

/** Reads the device-local calendar day, ignoring the time of day. */
export function fromJsDate(date: Date): CivilDate {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(date.getFullYear()).padStart(4, '0')}-${month}-${day}`;
}

/** A device-local midnight for the given day, for feeding native date pickers. */
export function toJsDate(value: CivilDate): Date {
  const parts = parseCivilDate(value);
  if (!parts) throw new RangeError(`Invalid civil date: ${value}`);
  return new Date(parts.year, parts.month - 1, parts.day);
}

export function todayIn(timezone: string, now: Date = new Date()): CivilDate {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
    const value = `${pick('year')}-${pick('month')}-${pick('day')}`;
    return isCivilDate(value) ? value : fromJsDate(now);
  } catch {
    return fromJsDate(now);
  }
}

export function tripPhase(start: CivilDate, end: CivilDate, today: CivilDate): TripPhase {
  if (compareCivilDates(today, start) < 0) return 'upcoming';
  if (compareCivilDates(today, end) > 0) return 'past';
  return 'ongoing';
}

function formatterFor(locale: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
}

function asUtcDate(value: CivilDate): Date {
  return new Date(toUtcMs(value));
}

export function formatCivilDate(value: CivilDate, locale: string): string {
  return formatterFor(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
    asUtcDate(value),
  );
}

/** Compact range: `1–15 abr 2027`, `28 mar – 4 abr 2027`, or both full dates across years. */
export function formatCivilRange(start: CivilDate, end: CivilDate, locale: string): string {
  const from = parseCivilDate(start);
  const to = parseCivilDate(end);
  if (!from || !to) return `${start} – ${end}`;

  if (start === end) return formatCivilDate(start, locale);
  if (from.year !== to.year) {
    return `${formatCivilDate(start, locale)} – ${formatCivilDate(end, locale)}`;
  }

  const month = formatterFor(locale, { month: 'short' });
  const year = formatterFor(locale, { year: 'numeric' }).format(asUtcDate(end));
  if (from.month === to.month) {
    return `${from.day}–${to.day} ${month.format(asUtcDate(end))} ${year}`;
  }
  return `${from.day} ${month.format(asUtcDate(start))} – ${to.day} ${month.format(asUtcDate(end))} ${year}`;
}
