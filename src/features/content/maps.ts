import type { Location } from '@/core/api';

/** `lat,lng` when the place has coordinates, otherwise what a person would type into a maps app. */
export function pointOf(location: Location | null | undefined): string | null {
  if (!location) return null;
  if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
    return `${location.latitude},${location.longitude}`;
  }
  const text = (location.address || location.name || '').trim();
  return text === '' ? null : text;
}

const enc = encodeURIComponent;

/** Opens the place itself (not directions) in Google Maps; on a phone it opens the app. Needs no key. */
export function placeUrl(location: Location): string | null {
  const point = pointOf(location);
  return point ? `https://www.google.com/maps/search/?api=1&query=${enc(point)}` : null;
}

export function applePlaceUrl(location: Location): string | null {
  const point = pointOf(location);
  return point
    ? `https://maps.apple.com/?q=${enc(location.name || point)}&address=${enc(point)}`
    : null;
}

export function shareMessage(title: string, detail: string | undefined, url: string): string {
  return [title, detail, url].filter((line) => line && line.trim() !== '').join('\n');
}
