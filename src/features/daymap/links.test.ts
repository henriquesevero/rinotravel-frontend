import type { Stop } from './stops';
import { legUrl, routeLinks } from './links';

function stop(index: number, date = '2027-04-02', dayIndex = 0): Stop {
  return {
    key: `s${index}`,
    kind: 'item',
    date,
    dayIndex,
    refId: `r${index}`,
    title: `Parada ${index}`,
    time: '',
    endTime: '',
    location: { name: `Lugar ${index}`, latitude: 35 + index / 100, longitude: 139 },
  };
}
const many = (n: number, date?: string, dayIndex?: number, from = 0) =>
  Array.from({ length: n }, (_, i) => stop(from + i, date, dayIndex));
const query = (url: string) => new URL(url).searchParams;

describe('routeLinks for a day', () => {
  it('opens a short day as one route: first stop to last, the rest as stops between', () => {
    const [link, ...more] = routeLinks(many(4), { mode: 'DRIVING', maxPoints: 11, scope: 'day' });
    expect(more).toEqual([]);
    const q = query(link?.url ?? '');
    expect(new URL(link?.url ?? '').pathname).toBe('/maps/dir/');
    expect(q.get('origin')).toBe('35,139');
    expect(q.get('destination')).toBe('35.03,139');
    expect(q.get('waypoints')).toBe('35.01,139|35.02,139');
    expect(q.get('travelmode')).toBe('driving');
    expect(link).toMatchObject({ count: 4, first: 1, last: 4 });
  });

  it('cannot ask for transit with stops in between, so it leaves the mode out', () => {
    const [link] = routeLinks(many(3), { mode: 'TRANSIT', maxPoints: 11, scope: 'day' });
    expect(query(link?.url ?? '').has('travelmode')).toBe(false);
    expect(query(link?.url ?? '').get('waypoints')).toBe('35.01,139');
    const walking = routeLinks(many(3), { mode: 'WALKING', maxPoints: 11, scope: 'day' });
    expect(query(walking[0]?.url ?? '').get('travelmode')).toBe('walking');
  });

  it('cuts a long day into parts where each starts at the stop the last one ended on', () => {
    const links = routeLinks(many(12), { mode: 'DRIVING', maxPoints: 5, scope: 'day' });
    expect(links.map((l) => [l.first, l.last])).toEqual([
      [1, 5],
      [5, 9],
      [9, 12],
    ]);
    // Continuity: the end of one part is the start of the next.
    expect(query(links[0]?.url ?? '').get('destination')).toBe(
      query(links[1]?.url ?? '').get('origin'),
    );
    // No link asks for more than a phone can take: origin, three stops between, destination.
    for (const link of links) {
      const between = query(link.url).get('waypoints')?.split('|').length ?? 0;
      expect(between).toBeLessThanOrEqual(3);
    }
  });

  it('opens a single stop as the place itself, not as directions', () => {
    const [link] = routeLinks(many(1), { mode: 'TRANSIT', maxPoints: 11, scope: 'day' });
    expect(new URL(link?.url ?? '').pathname).toBe('/maps/search/');
  });

  it('gives nothing for an empty day', () => {
    expect(routeLinks([], { mode: 'TRANSIT', maxPoints: 11, scope: 'day' })).toEqual([]);
  });

  it('uses the address when a stop has no coordinates', () => {
    const address: Stop = { ...stop(0), location: { name: 'Shibuya', address: 'Shibuya, Tóquio' } };
    const [link] = routeLinks([address, stop(1)], { mode: 'DRIVING', maxPoints: 11, scope: 'day' });
    expect(query(link?.url ?? '').get('origin')).toBe('Shibuya, Tóquio');
  });

  it('keeps hostile text inside its own parameter', () => {
    const evil: Stop = { ...stop(0), location: { name: 'x&travelmode=walking#y|z' } };
    const [link] = routeLinks([evil, stop(1)], { mode: 'DRIVING', maxPoints: 11, scope: 'day' });
    expect(query(link?.url ?? '').get('origin')).toBe('x&travelmode=walking#y|z');
    expect(query(link?.url ?? '').get('travelmode')).toBe('driving');
  });
});

describe('routeLinks for a whole trip', () => {
  const trip = [...many(3, '2027-04-02', 1, 0), ...many(2, '2027-04-03', 2, 10)];

  it('opens a trip that fits as a single route across the days', () => {
    const links = routeLinks(trip, { mode: 'DRIVING', maxPoints: 11, scope: 'trip' });
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ count: 5, first: 1, last: 5 });
  });

  it('offers a trip that does not fit one day at a time, each tagged with its day', () => {
    const links = routeLinks(trip, { mode: 'DRIVING', maxPoints: 3, scope: 'trip' });
    expect(links.map((l) => [l.date, l.dayIndex, l.first, l.last])).toEqual([
      ['2027-04-02', 1, 1, 3],
      ['2027-04-03', 2, 4, 5],
    ]);
  });

  it('cuts a single crowded day of a big trip into parts', () => {
    const big = [...many(7, '2027-04-02', 0), ...many(2, '2027-04-03', 1, 20)];
    const links = routeLinks(big, { mode: 'DRIVING', maxPoints: 5, scope: 'trip' });
    expect(links.filter((l) => l.date === '2027-04-02').map((l) => [l.first, l.last])).toEqual([
      [1, 5],
      [5, 7],
    ]);
    expect(links.filter((l) => l.date === '2027-04-03')).toHaveLength(1);
  });
});

describe('legUrl', () => {
  it('opens one hop with real public transit', () => {
    const q = query(legUrl(stop(0), stop(1), 'TRANSIT') ?? '');
    expect(q.get('origin')).toBe('35,139');
    expect(q.get('destination')).toBe('35.01,139');
    expect(q.get('travelmode')).toBe('transit');
    expect(q.has('waypoints')).toBe(false);
  });

  it('follows the chosen mode', () => {
    expect(query(legUrl(stop(0), stop(1), 'WALKING') ?? '').get('travelmode')).toBe('walking');
  });
});
