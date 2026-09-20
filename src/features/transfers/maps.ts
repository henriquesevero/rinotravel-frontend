import type { Location, Transfer, TransferMode } from '@/core/api';

export type MapsMode = 'driving' | 'walking' | 'transit';

export interface MapsRoute {
  origin: string;
  destination: string;
  mode: MapsMode;
}

/** `lat,lng` when the place has coordinates, otherwise what a person would type into a maps app. */
export function pointOf(location: Location | null | undefined): string | null {
  if (!location) return null;
  if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
    return `${location.latitude},${location.longitude}`;
  }
  const text = (location.address || location.name || '').trim();
  return text === '' ? null : text;
}

const DRIVING: TransferMode[] = ['CAR', 'TAXI', 'RIDESHARE'];

/**
 * Maps apps take one travel mode for the whole trip. Anything public (subway, train, bus, or a mix)
 * is "transit"; a trip made only of walking or only of driving keeps that mode.
 */
export function travelModeOf(modes: TransferMode[]): MapsMode {
  if (modes.length > 0 && modes.every((mode) => mode === 'WALKING')) return 'walking';
  if (modes.length > 0 && modes.every((mode) => DRIVING.includes(mode))) return 'driving';
  return 'transit';
}

/** Null when either end has nothing a maps app could search for. */
export function routeOf(transfer: Transfer): MapsRoute | null {
  const first = transfer.legs[0];
  const last = transfer.legs[transfer.legs.length - 1];
  const origin = pointOf(transfer.origin) ?? pointOf(first?.origin);
  const destination = pointOf(transfer.destination) ?? pointOf(last?.destination);
  if (!origin || !destination) return null;
  return { origin, destination, mode: travelModeOf(transfer.legs.map((leg) => leg.mode)) };
}

const enc = encodeURIComponent;

/** Opens the Google Maps app on a phone (universal link) or the site anywhere else. Needs no key. */
export function googleMapsUrl(route: MapsRoute): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${enc(route.origin)}&destination=${enc(route.destination)}&travelmode=${route.mode}`;
}

const APPLE_FLAG: Record<MapsMode, string> = { transit: 'r', walking: 'w', driving: 'd' };

export function appleMapsUrl(route: MapsRoute): string {
  return `https://maps.apple.com/?saddr=${enc(route.origin)}&daddr=${enc(route.destination)}&dirflg=${APPLE_FLAG[route.mode]}`;
}

/** The interactive map shown inside the app: Google draws the route, so nothing is stored here. */
export function embedUrl(key: string, route: MapsRoute, language: string): string {
  return `https://www.google.com/maps/embed/v1/directions?key=${enc(key)}&origin=${enc(route.origin)}&destination=${enc(route.destination)}&mode=${route.mode}&language=${enc(language)}`;
}

export function shareMessage(title: string, detail: string | undefined, url: string): string {
  return [title, detail, url].filter((line) => line && line.trim() !== '').join('\n');
}
