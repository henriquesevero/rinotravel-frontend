import type { DayMapLeg } from '@/core/api';

import type { Stop } from './stops';

export interface LegView {
  from: number;
  to: number;
  /** False when no route was found: nothing is guessed. */
  available: boolean;
  minutes: number | null;
  meters: number | null;
  /** When to leave to be at the next stop on time, `HH:MM`. */
  leaveBy: string | null;
  /** Minutes between the end of the stop and the start of the next one. */
  gapMinutes: number | null;
  /** True when the trip takes longer than the time available. */
  tight: boolean;
}

function toMinutes(clock: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(clock);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Turns the trips between stops into what a person needs: how long, when to leave, and whether the
 * plan is realistic. The end of a stop is unknown for most records; then its start is used, which
 * only flags trips that are impossible, never ones that merely look tight.
 */
export function legViews(stops: Stop[], legs: DayMapLeg[]): LegView[] {
  return legs.map((leg) => {
    const minutes =
      leg.available && leg.durationSeconds ? Math.ceil(leg.durationSeconds / 60) : null;
    const from = stops[leg.from];
    const to = stops[leg.to];
    const arriveBy = to ? toMinutes(to.time) : null;
    const freeFrom = from ? (toMinutes(from.endTime) ?? toMinutes(from.time)) : null;

    const leaveBy =
      minutes !== null && arriveBy !== null && arriveBy - minutes >= 0
        ? formatClock(arriveBy - minutes)
        : null;
    const gapMinutes = arriveBy !== null && freeFrom !== null ? arriveBy - freeFrom : null;

    return {
      from: leg.from,
      to: leg.to,
      available: leg.available,
      minutes,
      meters: leg.available && leg.distanceMeters ? leg.distanceMeters : null,
      leaveBy,
      gapMinutes,
      tight: minutes !== null && gapMinutes !== null && gapMinutes < minutes,
    };
  });
}

export function totals(views: LegView[]): { minutes: number; meters: number } {
  return views.reduce(
    (sum, view) => ({
      minutes: sum.minutes + (view.minutes ?? 0),
      meters: sum.meters + (view.meters ?? 0),
    }),
    { minutes: 0, meters: 0 },
  );
}

export function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}
