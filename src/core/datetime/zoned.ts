import { parseCivilDate, type CivilDate } from './civil-date';

/** A wall-clock moment in a named zone, as the API sends it: `2027-04-10T09:30:00` + `Asia/Tokyo`. */
export interface Zoned {
  dateTime: string;
  timezone: string;
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MS_PER_DAY = 86_400_000;

export function isTime(value: string): boolean {
  return TIME.test(value);
}

export function splitZoned(zoned: Zoned | null | undefined): { date: CivilDate; time: string } {
  if (!zoned) return { date: '', time: '' };
  const [date = '', time = ''] = zoned.dateTime.split('T');
  return { date, time: time.slice(0, 5) };
}

export function joinZoned(date: CivilDate, time: string, timezone: string): Zoned {
  return { dateTime: `${date}T${time}:00`, timezone };
}

/** `''` when the user left the field empty, so optional times can be cleared. */
export function joinOptionalZoned(date: CivilDate, time: string, timezone: string): Zoned | null {
  if (!date || !time) return null;
  return joinZoned(date, time, timezone);
}

export function zonedDate(zoned: Zoned): CivilDate {
  return zoned.dateTime.slice(0, 10);
}

export function zonedTime(zoned: Zoned): string {
  return zoned.dateTime.slice(11, 16);
}

/** Sorting key that is meaningful within one zone; entries of different zones are ordered by the API. */
export function zonedKey(zoned: Zoned | undefined): string {
  return zoned?.dateTime ?? '9999';
}

function utcMs(date: CivilDate): number {
  const parts = parseCivilDate(date);
  if (!parts) throw new RangeError(`Invalid civil date: ${date}`);
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

export function addDays(date: CivilDate, days: number): CivilDate {
  return new Date(utcMs(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function daysBetween(from: CivilDate, to: CivilDate): number {
  return Math.round((utcMs(to) - utcMs(from)) / MS_PER_DAY);
}

export function eachDay(start: CivilDate, end: CivilDate): CivilDate[] {
  const count = daysBetween(start, end);
  return count < 0 ? [] : Array.from({ length: count + 1 }, (_, index) => addDays(start, index));
}

const utc = (locale: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });

/** `sexta-feira, 10 de abril` */
export function formatDayHeading(date: CivilDate, locale: string): string {
  return utc(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(utcMs(date)),
  );
}

/** `sex., 10 abr` */
export function formatDayShort(date: CivilDate, locale: string): string {
  return utc(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(utcMs(date)),
  );
}

export function formatDayMonth(date: CivilDate, locale: string): string {
  return utc(locale, { day: 'numeric', month: 'short' }).format(new Date(utcMs(date)));
}

/** `10 abr, 09:30` — the wall-clock time of the zone the moment belongs to. */
export function formatZoned(zoned: Zoned, locale: string): string {
  return `${formatDayMonth(zonedDate(zoned), locale)}, ${zonedTime(zoned)}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`;
}

function zoneOffsetMs(utcMs: number, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const local = Date.UTC(
    pick('year'),
    pick('month') - 1,
    pick('day'),
    pick('hour'),
    pick('minute'),
    pick('second'),
  );
  return local - Math.floor(utcMs / 1000) * 1000;
}

/** The absolute moment a wall-clock time in a zone refers to, in epoch milliseconds. */
export function zonedInstant(zoned: Zoned): number {
  const naive = Date.parse(`${zoned.dateTime}Z`);
  if (Number.isNaN(naive)) return Number.NaN;
  try {
    const first = naive - zoneOffsetMs(naive, zoned.timezone);
    // A second pass settles times that sit next to a daylight-saving change.
    return naive - zoneOffsetMs(first, zoned.timezone);
  } catch {
    return Number.NaN;
  }
}

export function minutesBetween(from: Zoned, to: Zoned): number {
  return Math.round((zonedInstant(to) - zonedInstant(from)) / 60_000);
}
