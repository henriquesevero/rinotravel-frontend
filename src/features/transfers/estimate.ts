import type { TransferLegInput, TransferMode } from '@/core/api';
import { isTime, minutesBetween, type Zoned } from '@/core/datetime/zoned';

/** "Other" has no route a map could time; every other way of getting around does. */
export function canEstimate(mode: TransferMode): boolean {
  return mode !== 'OTHER';
}

/**
 * The clock time of arriving `minutes` after leaving at `departTime` (`HH:MM`), on the same day.
 * Null when the departure is missing or the trip runs past midnight: the form has one date for both
 * ends, so an arrival "the next morning" cannot be written as a time of that day.
 */
export function arrivalFrom(departTime: string, minutes: number): string | null {
  if (!isTime(departTime) || !Number.isFinite(minutes) || minutes < 0) return null;
  const [hours = 0, mins = 0] = departTime.split(':').map(Number);
  const total = hours * 60 + mins + Math.round(minutes);
  if (total >= 24 * 60) return null;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * The legs of a route the person picked, ready to save. The route service times its steps by a
 * timetable, and with no departure asked for it uses today's, so those clock times are not kept:
 * each step keeps how long it takes, and the transfer starts and ends when the form says (the
 * departure typed, the arrival worked out from the map or typed too).
 */
export function legsForSaving(
  legs: TransferLegInput[],
  departure: Zoned | null,
  arrival: Zoned | null,
): TransferLegInput[] {
  const untimed = legs.map((leg): TransferLegInput => {
    const { departure: left, arrival: arrived, ...rest } = leg;
    const minutes =
      leg.estimatedDurationMinutes ?? (left && arrived ? minutesBetween(left, arrived) : undefined);
    return minutes === undefined ? rest : { ...rest, estimatedDurationMinutes: minutes };
  });
  const first = untimed[0];
  const last = untimed[untimed.length - 1];
  if (first && departure) first.departure = departure;
  if (last && arrival) last.arrival = arrival;
  return untimed;
}
