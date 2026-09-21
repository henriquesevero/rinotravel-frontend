import type { TransferLegInput } from '@/core/api';

import { arrivalFrom, canEstimate, legsForSaving } from './estimate';

describe('arrivalFrom', () => {
  it('adds the time the map gives to the time of leaving', () => {
    expect(arrivalFrom('08:00', 39)).toBe('08:39');
    expect(arrivalFrom('08:45', 30)).toBe('09:15');
    expect(arrivalFrom('00:00', 0)).toBe('00:00');
  });

  it('rounds a fraction of a minute', () => {
    expect(arrivalFrom('10:00', 39.6)).toBe('10:40');
  });

  it('has no arrival when there is no departure to count from', () => {
    expect(arrivalFrom('', 39)).toBeNull();
    expect(arrivalFrom('8h', 39)).toBeNull();
  });

  it('has no arrival on the same day when the trip runs past midnight', () => {
    expect(arrivalFrom('23:30', 45)).toBeNull();
    expect(arrivalFrom('23:30', 29)).toBe('23:59');
  });
});

describe('canEstimate', () => {
  it('times every way of travelling but "other"', () => {
    expect(canEstimate('SUBWAY')).toBe(true);
    expect(canEstimate('WALKING')).toBe(true);
    expect(canEstimate('OTHER')).toBe(false);
  });
});

describe('legsForSaving', () => {
  const at = (dateTime: string) => ({ dateTime, timezone: 'America/New_York' });
  const route: TransferLegInput[] = [
    { mode: 'WALKING', estimatedDurationMinutes: 5 },
    {
      mode: 'TRAIN',
      line: 'AirTrain',
      // Times from today's timetable: the day the route was looked up, not the day of the trip.
      departure: at('2026-09-20T19:05:00'),
      arrival: at('2026-09-20T19:13:00'),
    },
    { mode: 'WALKING', estimatedDurationMinutes: 8 },
  ];

  it('drops the timetable clock times but keeps how long each step takes', () => {
    const legs = legsForSaving(route, null, null);
    expect(legs.map((leg) => [leg.departure, leg.arrival])).toEqual([
      [undefined, undefined],
      [undefined, undefined],
      [undefined, undefined],
    ]);
    expect(legs.map((leg) => leg.estimatedDurationMinutes)).toEqual([5, 8, 8]);
    expect(legs[1]?.line).toBe('AirTrain');
  });

  it('starts the transfer when the person leaves and ends it when they arrive', () => {
    const legs = legsForSaving(route, at('2026-11-19T08:00:00'), at('2026-11-19T08:39:00'));
    expect(legs[0]?.departure).toEqual(at('2026-11-19T08:00:00'));
    expect(legs[2]?.arrival).toEqual(at('2026-11-19T08:39:00'));
    expect(legs[1]?.departure).toBeUndefined();
  });

  it('does not change the route it was given', () => {
    legsForSaving(route, at('2026-11-19T08:00:00'), null);
    expect(route[0]?.departure).toBeUndefined();
    expect(route[1]?.departure).toEqual(at('2026-09-20T19:05:00'));
  });
});
