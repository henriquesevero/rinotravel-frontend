import type {
  DayMapStop,
  Hotel,
  ItineraryCategory,
  ItineraryDay,
  ItineraryItem,
  Location,
  Restaurant,
} from '@/core/api';
import { zonedDate, zonedTime } from '@/core/datetime/zoned';
import { pointOf } from '@/features/transfers/maps';

export type StopKind = 'item' | 'restaurant' | 'hotel-in' | 'hotel-out';

/** One place to be at on a given day, in the order it happens. */
export interface Stop {
  key: string;
  kind: StopKind;
  /** The id of the record it came from, for opening it. */
  refId: string;
  title: string;
  subtitle?: string;
  /** Local `HH:MM`, or empty when the record has no time. */
  time: string;
  endTime: string;
  location: Location;
  category?: ItineraryCategory;
}

interface Sources {
  date: string;
  days: ItineraryDay[];
  items: ItineraryItem[];
  restaurants: Restaurant[];
  hotels: Hotel[];
}

const LAST = '99:99';

/**
 * Everything on `date` that has a place a map can find: activities, restaurant reservations and hotel
 * check-in/out. Flights and transfers have no place of their own (they are the trips between places).
 */
export function buildStops({ date, days, items, restaurants, hotels }: Sources): Stop[] {
  const dayIds = new Set(days.filter((day) => day.date === date).map((day) => day.id));
  const stops: Stop[] = [];

  for (const item of items) {
    if (!dayIds.has(item.dayId) || !item.location || !pointOf(item.location)) continue;
    stops.push({
      key: `item-${item.id}`,
      kind: 'item',
      refId: item.id,
      title: item.title,
      ...(item.location.address ? { subtitle: item.location.address } : {}),
      time: item.start ? zonedTime(item.start) : '',
      endTime: item.end ? zonedTime(item.end) : '',
      location: item.location,
      category: item.category,
    });
  }
  for (const restaurant of restaurants) {
    const at = restaurant.reservationAt;
    if (!at || zonedDate(at) !== date || !restaurant.location || !pointOf(restaurant.location)) {
      continue;
    }
    stops.push({
      key: `restaurant-${restaurant.id}`,
      kind: 'restaurant',
      refId: restaurant.id,
      title: restaurant.name,
      ...(restaurant.location.address ? { subtitle: restaurant.location.address } : {}),
      time: zonedTime(at),
      endTime: '',
      location: restaurant.location,
    });
  }
  for (const hotel of hotels) {
    if (!hotel.location || !pointOf(hotel.location)) continue;
    for (const [kind, moment] of [
      ['hotel-in', hotel.checkIn],
      ['hotel-out', hotel.checkOut],
    ] as const) {
      if (zonedDate(moment) !== date) continue;
      stops.push({
        key: `${kind}-${hotel.id}`,
        kind,
        refId: hotel.id,
        title: hotel.name,
        ...(hotel.location.address ? { subtitle: hotel.location.address } : {}),
        time: zonedTime(moment),
        endTime: '',
        location: hotel.location,
      });
    }
  }

  // Array.prototype.sort is stable, so records with the same time keep the order they came in.
  stops.sort((a, b) => (a.time || LAST).localeCompare(b.time || LAST));

  // Two stops in a row at the same place (a lunch item and its restaurant booking) are one visit.
  return stops.filter(
    (stop, index) => index === 0 || pointOf(stop.location) !== pointOf(stops[index - 1]?.location),
  );
}

export function toRequestStops(stops: Stop[]): DayMapStop[] {
  return stops.map((stop) => ({ label: stop.title, location: stop.location }));
}

/** A stable text for a set of stops, so the same day is not fetched twice. */
export function stopsSignature(stops: Stop[]): string {
  return stops.map((stop) => `${stop.key}@${pointOf(stop.location)}`).join('|');
}
