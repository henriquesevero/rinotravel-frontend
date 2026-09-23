import type {
  DayMapStop,
  Hotel,
  ItineraryCategory,
  ItineraryDay,
  ItineraryItem,
  Location,
  Restaurant,
  Ticket,
} from '@/core/api';
import { zonedDate, zonedTime } from '@/core/datetime/zoned';
import { pointOf } from '@/features/content/maps';

export type StopKind = 'item' | 'restaurant' | 'hotel-in' | 'hotel-out' | 'ticket';

/** One place to be at on a given day, in the order it happens. */
export interface Stop {
  key: string;
  kind: StopKind;
  /** The civil date of the day it happens on. */
  date: string;
  /** Position of that day in the trip (0-based); tells days apart in a whole-trip map. */
  dayIndex: number;
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
  tickets?: Ticket[];
}

const LAST = '99:99';

/**
 * Everything on `date` that has a place a map can find: activities, restaurant reservations, hotel
 * check-in/out and tickets (where they are used). Flights have no place of their own here (the
 * airport is not somewhere to visit); the trip between two stops is drawn by the map itself.
 */
export function buildStops({
  date,
  days,
  items,
  restaurants,
  hotels,
  tickets = [],
}: Sources): Stop[] {
  const dayIds = new Set(days.filter((day) => day.date === date).map((day) => day.id));
  const stops: Stop[] = [];

  for (const item of items) {
    if (!dayIds.has(item.dayId) || !item.location || !pointOf(item.location)) continue;
    stops.push({
      key: `item-${item.id}`,
      kind: 'item',
      date,
      dayIndex: 0,
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
      date,
      dayIndex: 0,
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
        date,
        dayIndex: 0,
        refId: hotel.id,
        title: hotel.name,
        ...(hotel.location.address ? { subtitle: hotel.location.address } : {}),
        time: zonedTime(moment),
        endTime: '',
        location: hotel.location,
      });
    }
  }

  for (const ticket of tickets) {
    if (!ticket.start || zonedDate(ticket.start) !== date) continue;
    if (!ticket.location || !pointOf(ticket.location)) continue;
    const where = ticket.location.name ?? ticket.location.address;
    stops.push({
      key: `ticket-${ticket.id}`,
      kind: 'ticket',
      date,
      dayIndex: 0,
      refId: ticket.id,
      title: ticket.name,
      ...(where ? { subtitle: where } : {}),
      time: zonedTime(ticket.start),
      endTime: ticket.end ? zonedTime(ticket.end) : '',
      location: ticket.location,
    });
  }

  // Array.prototype.sort is stable, so records with the same time keep the order they came in.
  stops.sort((a, b) => (a.time || LAST).localeCompare(b.time || LAST));

  // Two stops in a row at the same place (a lunch item and its restaurant booking) are one visit.
  return stops.filter(
    (stop, index) => index === 0 || !sameSpot(stop.location, stops[index - 1]?.location),
  );
}

/** What a pin says for a day of the trip: 1 to 9, then A to Z (the map picture takes one character). */
export function dayLabel(dayIndex: number): string {
  if (dayIndex < 9) return String(dayIndex + 1);
  return dayIndex < 35 ? String.fromCharCode(65 + dayIndex - 9) : '';
}

/** The label a pin carries within one day: 1 to 9, then A, B, C. Same scheme as `dayLabel`, for the
 * order of a stop within its day rather than the day itself. */
export function stopOrderLabel(index: number): string {
  return index < 9 ? String(index + 1) : String.fromCharCode(65 + index - 9);
}

/** The most stops the server draws at once; a trip longer than this is cut, and the screen says so. */
export const MAX_TRIP_STOPS = 80;

/**
 * For a whole trip each day is a group with its own colour and its number on the pin. For one day
 * the server numbers the pins itself, in order.
 */
/**
 * True when two records point at the same spot even if they were typed differently: the same
 * coordinates within a few metres, or one address that is the start of the other
 * ("205 E Houston St" and "205 E Houston St, New York, NY 10002").
 */
export function sameSpot(a: Location, b: Location | undefined): boolean {
  if (!b) return false;
  if (
    typeof a.latitude === 'number' &&
    typeof a.longitude === 'number' &&
    typeof b.latitude === 'number' &&
    typeof b.longitude === 'number'
  ) {
    return (
      Math.abs(a.latitude - b.latitude) < 0.0002 && Math.abs(a.longitude - b.longitude) < 0.0002
    );
  }
  const text = (place: Location) =>
    (place.address || place.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const x = text(a);
  const y = text(b);
  if (x === '' || y === '') return false;
  return x === y || (Math.min(x.length, y.length) >= 8 && (x.startsWith(y) || y.startsWith(x)));
}

export function toRequestStops(stops: Stop[], scope: 'day' | 'trip' = 'day'): DayMapStop[] {
  return stops.map((stop) => ({
    label: stop.title,
    location: stop.location,
    ...(scope === 'trip' ? { group: stop.dayIndex, pin: dayLabel(stop.dayIndex) } : {}),
  }));
}

/** Every stop of every day in trip order, each tagged with its day. Days are given in order. */
export function buildTripStops(dates: string[], sources: Omit<Sources, 'date'>): Stop[] {
  return dates.flatMap((date, dayIndex) =>
    buildStops({ date, ...sources }).map((stop) => ({ ...stop, dayIndex })),
  );
}

/** Things scheduled that day that a map cannot place because they have no location yet. */
export interface UnlocatedItem {
  key: string;
  refId: string;
  title: string;
  time: string;
}

export function buildUnlocated({
  date,
  days,
  items,
}: Pick<Sources, 'date' | 'days' | 'items'>): UnlocatedItem[] {
  const dayIds = new Set(days.filter((day) => day.date === date).map((day) => day.id));
  return items
    .filter((item) => dayIds.has(item.dayId) && !pointOf(item.location))
    .map((item) => ({
      key: `item-${item.id}`,
      refId: item.id,
      title: item.title,
      time: item.start ? zonedTime(item.start) : '',
    }))
    .sort((a, b) => (a.time || LAST).localeCompare(b.time || LAST));
}

/** A stable text for a set of stops, so the same day is not fetched twice. */
export function stopsSignature(stops: Stop[]): string {
  return stops.map((stop) => `${stop.key}@${pointOf(stop.location)}#${stop.dayIndex}`).join('|');
}
