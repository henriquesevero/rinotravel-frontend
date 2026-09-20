import type { Itinerary, Trip } from '@/core/api';

import { entriesOn, pickFocusTrip, tripProgress, upcomingAgenda } from './agenda';

function trip(id: string, startDate: string, endDate: string): Trip {
  return {
    id,
    name: id,
    destination: 'X',
    startDate,
    endDate,
    timezone: 'UTC',
    currency: 'USD',
    ownerId: 'o',
    myRole: 'OWNER',
    capabilities: {
      updateTrip: true,
      manageMembers: true,
      writeContent: true,
      deleteTrip: true,
      transferOwnership: true,
      leave: false,
      addableRoles: [],
    },
    version: 1,
    createdAt: '2027-01-01T00:00:00Z',
    updatedAt: '2027-01-01T00:00:00Z',
  };
}

const today = () => '2027-04-10';

describe('pickFocusTrip', () => {
  const past = trip('past', '2027-01-01', '2027-01-10');
  const soon = trip('soon', '2027-04-20', '2027-04-30');
  const later = trip('later', '2027-09-01', '2027-09-10');
  const now = trip('now', '2027-04-08', '2027-04-12');

  it('leads with the trip under way', () => {
    expect(pickFocusTrip([past, soon, now, later], today)?.trip.id).toBe('now');
    expect(pickFocusTrip([past, soon, now], today)?.phase).toBe('ongoing');
  });

  it('otherwise takes the nearest upcoming trip, whatever the list order', () => {
    expect(pickFocusTrip([later, past, soon], today)?.trip.id).toBe('soon');
  });

  it('falls back to the most recent past trip', () => {
    const older = trip('older', '2026-01-01', '2026-01-10');
    expect(pickFocusTrip([older, past], today)?.trip.id).toBe('past');
  });

  it('is null without trips', () => {
    expect(pickFocusTrip([], today)).toBeNull();
  });
});

describe('tripProgress', () => {
  const t = trip('t', '2027-04-08', '2027-04-12');

  it('counts days to go, and zero on the first day is "during"', () => {
    expect(tripProgress(t, '2027-04-05')).toEqual({ kind: 'before', days: 3 });
    expect(tripProgress(t, '2027-04-08')).toEqual({ kind: 'during', day: 1, total: 5 });
    expect(tripProgress(t, '2027-04-12')).toEqual({ kind: 'during', day: 5, total: 5 });
    expect(tripProgress(t, '2027-04-13')).toEqual({ kind: 'after' });
  });
});

describe('agenda', () => {
  const entry = (id: string) => ({ kind: 'itinerary_item' as const, id, title: id });
  const days: Itinerary['days'] = [
    { date: '2027-04-12', day: null, entries: [entry('c'), entry('d')] },
    { date: '2027-04-09', day: null, entries: [entry('old')] },
    { date: '2027-04-10', day: null, entries: [entry('a'), entry('b')] },
    { date: '2027-04-11', day: null, entries: [] },
  ];

  it('picks the entries of one date', () => {
    expect(entriesOn(days, '2027-04-10').map((e) => e.id)).toEqual(['a', 'b']);
    expect(entriesOn(days, '2027-05-01')).toEqual([]);
  });

  it('skips the past and empty days, in date order', () => {
    const result = upcomingAgenda(days, '2027-04-10', 10);
    expect(result.map((day) => day.date)).toEqual(['2027-04-10', '2027-04-12']);
  });

  it('cuts after the limit, in the middle of a day if it has to', () => {
    const result = upcomingAgenda(days, '2027-04-10', 3);
    expect(result.flatMap((day) => day.entries.map((e) => e.id))).toEqual(['a', 'b', 'c']);
  });
});
