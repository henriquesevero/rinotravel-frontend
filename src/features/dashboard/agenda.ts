import type { Itinerary, TimelineEntry, Trip } from '@/core/api';
import { tripPhase, type TripPhase } from '@/core/datetime/civil-date';
import { daysBetween } from '@/core/datetime/zoned';

export interface FocusTrip {
  trip: Trip;
  phase: TripPhase;
}

/** The trip the dashboard leads with: the one under way, else the next to start, else the latest. */
export function pickFocusTrip(
  trips: Trip[],
  today: (timezone: string) => string,
): FocusTrip | null {
  const withPhase = trips.map((trip) => ({
    trip,
    phase: tripPhase(trip.startDate, trip.endDate, today(trip.timezone)),
  }));
  const inPhase = (phase: TripPhase) => withPhase.filter((item) => item.phase === phase);

  const ongoing = inPhase('ongoing').sort((a, b) => a.trip.endDate.localeCompare(b.trip.endDate));
  const upcoming = inPhase('upcoming').sort((a, b) =>
    a.trip.startDate.localeCompare(b.trip.startDate),
  );
  const past = inPhase('past').sort((a, b) => b.trip.endDate.localeCompare(a.trip.endDate));
  return ongoing[0] ?? upcoming[0] ?? past[0] ?? null;
}

export type Progress =
  | { kind: 'before'; days: number }
  | { kind: 'during'; day: number; total: number }
  | { kind: 'after' };

export function tripProgress(trip: Trip, today: string): Progress {
  if (today < trip.startDate) return { kind: 'before', days: daysBetween(today, trip.startDate) };
  if (today > trip.endDate) return { kind: 'after' };
  return {
    kind: 'during',
    day: daysBetween(trip.startDate, today) + 1,
    total: daysBetween(trip.startDate, trip.endDate) + 1,
  };
}

export interface AgendaDay {
  date: string;
  entries: TimelineEntry[];
}

export function entriesOn(days: Itinerary['days'], date: string): TimelineEntry[] {
  return days.find((day) => day.date === date)?.entries ?? [];
}

/** Non-empty days from `today` on, cut after `limit` entries in total. */
export function upcomingAgenda(days: Itinerary['days'], today: string, limit: number): AgendaDay[] {
  const result: AgendaDay[] = [];
  let remaining = limit;
  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    if (remaining <= 0) break;
    if (day.date < today || day.entries.length === 0) continue;
    const entries = day.entries.slice(0, remaining);
    result.push({ date: day.date, entries });
    remaining -= entries.length;
  }
  return result;
}
