import type { Transfer } from '@/core/api';

import { appleMapsUrl, googleMapsUrl, pointOf, routeOf, shareMessage, travelModeOf } from './maps';

function transfer(overrides: Partial<Transfer>): Transfer {
  return {
    id: 't',
    tripId: 'trip',
    version: 1,
    createdAt: '2027-01-01T00:00:00Z',
    updatedAt: '2027-01-01T00:00:00Z',
    status: 'PLANNED',
    legs: [],
    ...overrides,
  };
}

describe('pointOf', () => {
  it('prefers coordinates, then the address, then the name', () => {
    expect(pointOf({ name: 'Narita', address: 'Chiba', latitude: 35.77, longitude: 140.39 })).toBe(
      '35.77,140.39',
    );
    expect(pointOf({ name: 'Narita', address: 'Chiba' })).toBe('Chiba');
    expect(pointOf({ name: 'Narita' })).toBe('Narita');
  });

  it('gives up on empty places, and on null coordinates a draft may carry', () => {
    expect(pointOf(undefined)).toBeNull();
    expect(pointOf({ name: '  ', address: '' })).toBeNull();
    expect(pointOf({ name: 'A', latitude: null, longitude: null } as never)).toBe('A');
  });
});

describe('travelModeOf', () => {
  it.each([
    [['WALKING'], 'walking'],
    [['WALKING', 'WALKING'], 'walking'],
    [['CAR'], 'driving'],
    [['TAXI', 'RIDESHARE'], 'driving'],
    [['SUBWAY'], 'transit'],
    [['WALKING', 'SUBWAY', 'WALKING'], 'transit'],
    [['BUS', 'TRAIN'], 'transit'],
    [['OTHER'], 'transit'],
    [[], 'transit'],
  ] as const)('%j is %s', (modes, expected) => {
    expect(travelModeOf([...modes])).toBe(expected);
  });
});

describe('routeOf', () => {
  it('uses the transfer ends and the mode of its legs', () => {
    const route = routeOf(
      transfer({
        origin: { name: 'Aeroporto de Narita' },
        destination: { name: 'Hotel Sakura', address: 'Asakusa, Tokyo' },
        legs: [{ mode: 'TRAIN' }, { mode: 'WALKING' }],
      }),
    );
    expect(route).toEqual({
      origin: 'Aeroporto de Narita',
      destination: 'Asakusa, Tokyo',
      mode: 'transit',
    });
  });

  it('falls back to the first and last leg when the ends were never filled in', () => {
    const route = routeOf(
      transfer({
        legs: [
          { mode: 'WALKING', origin: { name: 'A' }, destination: { name: 'Estação' } },
          { mode: 'SUBWAY', origin: { name: 'Estação' }, destination: { name: 'B' } },
        ],
      }),
    );
    expect(route).toMatchObject({ origin: 'A', destination: 'B' });
  });

  it('is null when a maps app would have nothing to search for', () => {
    expect(routeOf(transfer({ origin: { name: 'A' } }))).toBeNull();
    expect(routeOf(transfer({}))).toBeNull();
  });
});

describe('links', () => {
  const route = {
    origin: 'Times Square, NYC',
    destination: '40.64,-73.78',
    mode: 'transit',
  } as const;

  it('builds a Google Maps directions link with everything escaped', () => {
    expect(googleMapsUrl(route)).toBe(
      'https://www.google.com/maps/dir/?api=1&origin=Times%20Square%2C%20NYC&destination=40.64%2C-73.78&travelmode=transit',
    );
  });

  it('builds an Apple Maps link with its own mode flag', () => {
    expect(appleMapsUrl(route)).toContain('dirflg=r');
    expect(appleMapsUrl({ ...route, mode: 'walking' })).toContain('dirflg=w');
    expect(appleMapsUrl({ ...route, mode: 'driving' })).toContain('dirflg=d');
    expect(appleMapsUrl(route)).toContain('saddr=Times%20Square%2C%20NYC');
  });

  it('cannot be broken out of by hostile text in a place name', () => {
    const url = googleMapsUrl({ ...route, origin: 'x&travelmode=driving#frag' });
    expect(new URL(url).searchParams.get('origin')).toBe('x&travelmode=driving#frag');
    expect(new URL(url).searchParams.get('travelmode')).toBe('transit');
  });

  it('joins the share message without empty lines', () => {
    expect(shareMessage('A → B', undefined, 'https://x')).toBe('A → B\nhttps://x');
    expect(shareMessage('A → B', 'Seg, 10 abr · 53 min', 'https://x')).toBe(
      'A → B\nSeg, 10 abr · 53 min\nhttps://x',
    );
  });
});
