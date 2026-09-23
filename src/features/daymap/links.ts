import { pointOf, placeUrl } from '@/features/content/maps';

import type { DayMode } from './hooks';
import type { Stop } from './stops';

const enc = encodeURIComponent;

/** Google Maps takes an origin, a destination and up to 9 stops between them on a computer, 3 on a phone. */
export const MAX_POINTS_DESKTOP = 11;
export const MAX_POINTS_MOBILE = 5;

export interface RouteLink {
  key: string;
  url: string;
  /** How many of the day's stops this link covers. */
  count: number;
  /** Position (1-based) in the list of the first and last stop it covers. */
  first: number;
  last: number;
  /** Set when the link is for one day of a whole-trip map. */
  dayIndex?: number;
  date?: string;
}

const MODE_PARAM: Record<DayMode, string> = {
  TRANSIT: 'transit',
  WALKING: 'walking',
  DRIVING: 'driving',
};

function directionsUrl(points: string[], travelmode: string | null): string {
  const origin = points[0] ?? '';
  const destination = points[points.length - 1] ?? '';
  const between = points.slice(1, -1);
  return (
    `https://www.google.com/maps/dir/?api=1&origin=${enc(origin)}&destination=${enc(destination)}` +
    (between.length > 0 ? `&waypoints=${enc(between.join('|'))}` : '') +
    (travelmode ? `&travelmode=${travelmode}` : '')
  );
}

/**
 * One link for the whole route, or several when it does not fit. Public transit cannot have stops in
 * between, so its links leave the travel mode out and Google shows every stop as a drive; the exact
 * transit of each hop is what {@link legUrl} is for.
 */
function overallMode(mode: DayMode): string | null {
  return mode === 'TRANSIT' ? null : MODE_PARAM[mode];
}

/** Slices `count` stops into parts of at most `size`, each starting where the last one ended. */
function parts(count: number, size: number): [number, number][] {
  if (count <= size) return [[0, count - 1]];
  const out: [number, number][] = [];
  for (let start = 0; start < count - 1; start += size - 1) {
    out.push([start, Math.min(start + size - 1, count - 1)]);
  }
  return out;
}

function linkFor(
  stops: Stop[],
  from: number,
  to: number,
  mode: DayMode,
  extra?: Partial<RouteLink>,
): RouteLink | null {
  const slice = stops.slice(from, to + 1);
  const points = slice.map((stop) => pointOf(stop.location)).filter((p): p is string => p !== null);
  if (points.length === 0) return null;
  const only = slice[0];
  const url =
    points.length === 1 && only
      ? (placeUrl(only.location) ?? '')
      : directionsUrl(points, overallMode(mode));
  return {
    key: `${from}-${to}`,
    url,
    count: slice.length,
    first: from + 1,
    last: to + 1,
    ...extra,
  };
}

/**
 * The links that open a day, or a whole trip, in Google Maps. A day that fits is a single link; a trip
 * that does not fit is offered one day at a time; a day that does not fit is offered in parts.
 */
export function routeLinks(
  stops: Stop[],
  { mode, maxPoints, scope }: { mode: DayMode; maxPoints: number; scope: 'day' | 'trip' },
): RouteLink[] {
  if (stops.length === 0) return [];
  const links: RouteLink[] = [];

  if (scope === 'day' || stops.length <= maxPoints) {
    for (const [from, to] of parts(stops.length, maxPoints)) {
      const link = linkFor(stops, from, to, mode);
      if (link) links.push(link);
    }
    return links;
  }

  // A whole trip too long for one link: one day at a time, each in parts if it must be.
  let start = 0;
  while (start < stops.length) {
    const date = stops[start]?.date;
    let end = start;
    while (end + 1 < stops.length && stops[end + 1]?.date === date) end++;
    for (const [from, to] of parts(end - start + 1, maxPoints)) {
      const link = linkFor(stops, start + from, start + to, mode, {
        dayIndex: stops[start]?.dayIndex ?? 0,
        ...(date ? { date } : {}),
      });
      if (link) links.push(link);
    }
    start = end + 1;
  }
  return links;
}

/** Directions for one hop between two stops, in the mode the day is being travelled. */
export function legUrl(from: Stop, to: Stop, mode: DayMode): string | null {
  const origin = pointOf(from.location);
  const destination = pointOf(to.location);
  if (!origin || !destination) return null;
  return directionsUrl([origin, destination], MODE_PARAM[mode]);
}
