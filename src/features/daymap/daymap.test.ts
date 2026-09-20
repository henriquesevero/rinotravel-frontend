import type { DayMapLeg, Hotel, ItineraryDay, ItineraryItem, Restaurant } from '@/core/api';

import { decodePolyline } from './polyline';
import { buildStops, stopsSignature } from './stops';
import { formatClock, formatDistance, legViews, totals } from './timing';

const base = {
  tripId: 't',
  version: 1,
  createdAt: '2027-01-01T00:00:00Z',
  updatedAt: '2027-01-01T00:00:00Z',
};
const day = (id: string, date: string): ItineraryDay => ({ ...base, id, date });
const item = (
  id: string,
  dayId: string,
  title: string,
  start: string | undefined,
  location: ItineraryItem['location'],
  end?: string,
): ItineraryItem => ({
  ...base,
  id,
  dayId,
  title,
  category: 'ATTRACTION',
  status: 'PLANNED',
  position: 0,
  location,
  ...(start ? { start: { dateTime: `2027-04-02T${start}:00`, timezone: 'Asia/Tokyo' } } : {}),
  ...(end ? { end: { dateTime: `2027-04-02T${end}:00`, timezone: 'Asia/Tokyo' } } : {}),
});

describe('polyline', () => {
  it("decodes Google's documented example", () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });

  it('survives garbage without throwing', () => {
    for (const bad of ['', '!', '_', '~~~~~~~~']) expect(() => decodePolyline(bad)).not.toThrow();
  });
});

describe('buildStops', () => {
  const days = [day('d1', '2027-04-02'), day('d2', '2027-04-03')];
  const empty = { restaurants: [] as Restaurant[], hotels: [] as Hotel[] };

  it('orders the day by time and leaves out what has no place', () => {
    const stops = buildStops({
      date: '2027-04-02',
      days,
      ...empty,
      items: [
        item('c', 'd1', 'Jantar', '19:30', { name: 'Restaurante' }),
        item('a', 'd1', 'Templo', '09:00', { name: 'Senso-ji', address: 'Asakusa' }),
        item('x', 'd1', 'Sem local', '10:00', undefined),
        item('other-day', 'd2', 'Outro dia', '08:00', { name: 'Ueno' }),
        item('b', 'd1', 'Museu', '14:00', { name: 'Museu Nacional' }),
      ],
    });
    expect(stops.map((s) => s.title)).toEqual(['Templo', 'Museu', 'Jantar']);
    expect(stops[0]).toMatchObject({ time: '09:00', subtitle: 'Asakusa', kind: 'item' });
  });

  it('puts records without a time last, keeping their order', () => {
    const stops = buildStops({
      date: '2027-04-02',
      days,
      ...empty,
      items: [
        item('1', 'd1', 'Sem hora A', undefined, { name: 'A' }),
        item('2', 'd1', 'Com hora', '10:00', { name: 'B' }),
        item('3', 'd1', 'Sem hora B', undefined, { name: 'C' }),
      ],
    });
    expect(stops.map((s) => s.title)).toEqual(['Com hora', 'Sem hora A', 'Sem hora B']);
  });

  it('adds restaurant reservations and hotel check-in and check-out of that day', () => {
    const restaurant = {
      ...base,
      id: 'r',
      name: 'Sushi',
      status: 'RESERVED',
      desiredDishes: [],
      location: { name: 'Sushi Zanmai' },
      reservationAt: { dateTime: '2027-04-02T20:00:00', timezone: 'Asia/Tokyo' },
    } as Restaurant;
    const hotel = {
      ...base,
      id: 'h',
      name: 'Hotel Sakura',
      location: { name: 'Hotel Sakura' },
      checkIn: { dateTime: '2027-04-02T15:00:00', timezone: 'Asia/Tokyo' },
      checkOut: { dateTime: '2027-04-05T11:00:00', timezone: 'Asia/Tokyo' },
    } as Hotel;

    const stops = buildStops({
      date: '2027-04-02',
      days,
      items: [],
      restaurants: [restaurant],
      hotels: [hotel],
    });
    expect(stops.map((s) => [s.time, s.kind])).toEqual([
      ['15:00', 'hotel-in'],
      ['20:00', 'restaurant'],
    ]);
    const checkout = buildStops({
      date: '2027-04-05',
      days,
      items: [],
      restaurants: [],
      hotels: [hotel],
    });
    expect(checkout.map((s) => s.kind)).toEqual(['hotel-out']);
  });

  it('treats two stops in a row at the same place as one visit', () => {
    const restaurant = {
      ...base,
      id: 'r',
      name: 'Katz',
      status: 'RESERVED',
      desiredDishes: [],
      location: { name: 'Katz', address: 'Houston St' },
      reservationAt: { dateTime: '2027-04-02T20:00:00', timezone: 'Asia/Tokyo' },
    } as Restaurant;
    const stops = buildStops({
      date: '2027-04-02',
      days,
      hotels: [],
      restaurants: [restaurant],
      items: [item('i', 'd1', 'Jantar no Katz', '20:00', { name: 'Katz', address: 'Houston St' })],
    });
    expect(stops).toHaveLength(1);
  });

  it('gives the same signature for the same stops, and another when the place changes', () => {
    const one = buildStops({
      date: '2027-04-02',
      days,
      ...empty,
      items: [item('a', 'd1', 'A', '09:00', { name: 'X' })],
    });
    const same = buildStops({
      date: '2027-04-02',
      days,
      ...empty,
      items: [item('a', 'd1', 'A', '09:00', { name: 'X' })],
    });
    const moved = buildStops({
      date: '2027-04-02',
      days,
      ...empty,
      items: [item('a', 'd1', 'A', '09:00', { name: 'Y' })],
    });
    expect(stopsSignature(one)).toBe(stopsSignature(same));
    expect(stopsSignature(one)).not.toBe(stopsSignature(moved));
  });
});

describe('legViews', () => {
  const days = [day('d1', '2027-04-02')];
  const stops = buildStops({
    date: '2027-04-02',
    days,
    restaurants: [],
    hotels: [],
    items: [
      item('a', 'd1', 'Templo', '09:00', { name: 'A' }, '10:30'),
      item('b', 'd1', 'Museu', '11:00', { name: 'B' }, '13:00'),
      item('c', 'd1', 'Jantar', '13:20', { name: 'C' }),
      item('d', 'd1', 'Sem hora', undefined, { name: 'D' }),
    ],
  });
  const leg = (from: number, seconds: number, meters = 1000): DayMapLeg => ({
    from,
    to: from + 1,
    available: true,
    durationSeconds: seconds,
    distanceMeters: meters,
  });

  it('says when to leave to arrive on time', () => {
    const [first] = legViews(stops, [leg(0, 25 * 60)]);
    expect(first).toMatchObject({ minutes: 25, leaveBy: '10:35', gapMinutes: 30, tight: false });
  });

  it('flags a trip longer than the time between the two stops', () => {
    const views = legViews(stops, [leg(0, 25 * 60), leg(1, 45 * 60)]);
    // The museum ends at 13:00 and dinner starts at 13:20: 20 minutes for a 45-minute trip.
    expect(views[1]).toMatchObject({ minutes: 45, gapMinutes: 20, tight: true, leaveBy: '12:35' });
  });

  it('never invents a time for a stop without one, or for a trip that was not found', () => {
    const views = legViews(stops, [leg(0, 600), leg(1, 600), { from: 2, to: 3, available: false }]);
    expect(views[2]).toMatchObject({
      available: false,
      minutes: null,
      leaveBy: null,
      tight: false,
    });
  });

  it('uses the start when a stop has no end, so it only flags what is impossible', () => {
    const noEnds = buildStops({
      date: '2027-04-02',
      days,
      restaurants: [],
      hotels: [],
      items: [
        item('a', 'd1', 'A', '09:00', { name: 'A' }),
        item('b', 'd1', 'B', '09:20', { name: 'B' }),
      ],
    });
    expect(legViews(noEnds, [leg(0, 40 * 60)])[0]).toMatchObject({ gapMinutes: 20, tight: true });
    expect(legViews(noEnds, [leg(0, 10 * 60)])[0]).toMatchObject({ tight: false });
  });

  it('sums the day and formats clock and distance', () => {
    const views = legViews(stops, [leg(0, 1500, 800), leg(1, 2700, 12400)]);
    expect(totals(views)).toEqual({ minutes: 70, meters: 13200 });
    expect(formatClock(9 * 60 + 5)).toBe('09:05');
    expect(formatDistance(800)).toBe('800 m');
    expect(formatDistance(12400)).toBe('12,4 km');
  });
});
