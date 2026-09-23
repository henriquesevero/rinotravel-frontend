import type {
  Expense,
  ExpenseCategory,
  Flight,
  Hotel,
  ItineraryDay,
  ItineraryItem,
  Money,
  Payment,
  Restaurant,
  Ticket,
} from '@/core/api';
import { zonedDate, zonedInstant, type Zoned } from '@/core/datetime/zoned';

import type { LinkType } from './link-targets';

/**
 * A line of the expenses that nobody typed: the price of something already in the trip (a ticket, a
 * meal in the itinerary, a flight). It is never stored; it is worked out each time from the record,
 * so changing the price there changes it here, and removing the record removes the line.
 */
export interface AutoLine extends Expense {
  auto: {
    type: LinkType;
    id: string;
    /** Whether it counts as paid when nobody said otherwise: it is done, or its date has passed. */
    paidByDefault: boolean;
    /** What the person said about it, if anything. */
    mark?: Payment;
  };
}

export function isAuto(expense: Expense): expense is AutoLine {
  return 'auto' in expense;
}

export interface MoneySources {
  /** Today in the trip's time zone, as a civil date. */
  today: string;
  /** The current moment; only tests set it. */
  now?: number;
  days: ItineraryDay[];
  items: ItineraryItem[];
  restaurants: Restaurant[];
  tickets: Ticket[];
  flights: Flight[];
  hotels: Hotel[];
  payments: Payment[];
}

const ITEM_CATEGORY: Record<ItineraryItem['category'], ExpenseCategory> = {
  RESTAURANT: 'FOOD',
  ATTRACTION: 'ACTIVITIES',
  SHOPPING: 'SOUVENIRS',
  FREE_TIME: 'OTHER',
  OTHER: 'OTHER',
};

interface Candidate {
  type: LinkType;
  id: string;
  name: string;
  category: ExpenseCategory;
  cost: Money | undefined;
  /** When it happens: a moment, or only a day. */
  at?: Zoned | undefined;
  day?: string | undefined;
  /** Done means the money is gone; skipped means it will not be spent at all. */
  done: boolean;
  skipped: boolean;
}

function toLine(
  c: Candidate,
  today: string,
  now: number,
  marks: Map<string, Payment>,
): AutoLine | null {
  if (!c.cost || c.skipped) return null;
  const date = c.at ? zonedDate(c.at) : c.day;
  // Something that has already happened is money spent, even if nobody ticked it off.
  const passed = c.at ? zonedInstant(c.at) < now : date !== undefined && date < today;
  const paidByDefault = c.done || passed;
  // What the person marked wins over the guess, in either direction.
  const mark = marks.get(`${c.type}:${c.id}`);
  const paid = mark ? mark.paid : paidByDefault;
  return {
    id: `auto:${c.type}:${c.id}`,
    tripId: '',
    version: 0,
    createdAt: '',
    updatedAt: '',
    name: c.name,
    category: c.category,
    status: paid ? 'PAID' : 'PLANNED',
    estimate: c.cost,
    ...(paid ? { actual: c.cost } : {}),
    ...(date ? { date } : {}),
    link: { type: c.type, id: c.id },
    auto: { type: c.type, id: c.id, paidByDefault, ...(mark ? { mark } : {}) },
  };
}

/**
 * The lines the trip's own records bring to the expenses. A wishlist place or restaurant is only an
 * idea, so it does not count until it is planned; something skipped does not count at all.
 */
export function deriveLines(sources: MoneySources): AutoLine[] {
  const { today, days, items, restaurants, tickets, flights, hotels } = sources;
  const marks = new Map(sources.payments.map((p) => [`${p.link.type}:${p.link.id}`, p]));
  const now = sources.now ?? Date.now();
  const dayDate = new Map(days.map((day) => [day.id, day.date]));

  const candidates: Candidate[] = [
    ...items.map((item): Candidate => ({
      type: 'itinerary_item',
      id: item.id,
      name: item.title,
      category: ITEM_CATEGORY[item.category],
      cost: item.estimatedCost,
      at: item.start ?? undefined,
      day: dayDate.get(item.dayId),
      done: item.status === 'COMPLETED',
      skipped: item.status === 'SKIPPED',
    })),
    ...restaurants.map((restaurant): Candidate => ({
      type: 'restaurant',
      id: restaurant.id,
      name: restaurant.name,
      category: 'FOOD',
      cost: restaurant.estimatedCost,
      at: restaurant.reservationAt ?? undefined,
      done: restaurant.status === 'VISITED',
      skipped: restaurant.status === 'WISHLIST',
    })),
    ...tickets.map((ticket): Candidate => ({
      type: 'ticket',
      id: ticket.id,
      name: ticket.name,
      category: 'ACTIVITIES',
      cost: ticket.cost,
      at: ticket.start ?? undefined,
      done: ticket.status === 'COMPLETED',
      skipped: ticket.status === 'SKIPPED',
    })),
    ...flights.map((flight): Candidate => ({
      type: 'flight',
      id: flight.id,
      name: `${flight.flightNumber} ${flight.departureAirport} → ${flight.arrivalAirport}`,
      category: 'TRANSPORT',
      cost: flight.cost,
      at: flight.departure,
      done: false,
      skipped: false,
    })),
    ...hotels.map((hotel): Candidate => ({
      type: 'hotel',
      id: hotel.id,
      name: hotel.name,
      category: 'LODGING',
      cost: hotel.cost,
      at: hotel.checkIn,
      done: false,
      skipped: false,
    })),
  ];

  return candidates.flatMap((candidate) => toLine(candidate, today, now, marks) ?? []);
}
