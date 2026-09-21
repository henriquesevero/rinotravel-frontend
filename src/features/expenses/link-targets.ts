import type { ExpenseLink } from '@/core/api';
import { flightHooks, hotelHooks, ticketHooks } from '@/features/bookings/hooks';
import { itemHooks } from '@/features/itinerary/hooks';
import { placeHooks, restaurantHooks } from '@/features/places/hooks';
import { transferHooks } from '@/features/transfers/hooks';

export type LinkType = ExpenseLink['type'];

export interface LinkTarget {
  key: string;
  type: LinkType;
  id: string;
  name: string;
}

export const targetKey = (type: string, id: string) => `${type}:${id}`;

/**
 * Every record of the trip a purchase can be tied to: places (a shop on the wishlist), restaurants,
 * things of the itinerary, tickets, hotels, flights and transfers. It reads the lists the other screens already keep.
 */
export function useLinkTargets(tripId: string) {
  const places = placeHooks.useList(tripId);
  const restaurants = restaurantHooks.useList(tripId);
  const items = itemHooks.useList(tripId);
  const tickets = ticketHooks.useList(tripId);
  const hotels = hotelHooks.useList(tripId);
  const flights = flightHooks.useList(tripId);
  const transfers = transferHooks.useList(tripId);

  const targets: LinkTarget[] = [
    ...(places.data ?? []).map((p) => ({ type: 'place' as const, id: p.id, name: p.name })),
    ...(restaurants.data ?? []).map((r) => ({
      type: 'restaurant' as const,
      id: r.id,
      name: r.name,
    })),
    ...(items.data ?? []).map((i) => ({
      type: 'itinerary_item' as const,
      id: i.id,
      name: i.title,
    })),
    ...(tickets.data ?? []).map((k) => ({ type: 'ticket' as const, id: k.id, name: k.name })),
    ...(hotels.data ?? []).map((h) => ({ type: 'hotel' as const, id: h.id, name: h.name })),
    ...(flights.data ?? []).map((f) => ({
      type: 'flight' as const,
      id: f.id,
      name: `${f.flightNumber} ${f.departureAirport} → ${f.arrivalAirport}`,
    })),
    ...(transfers.data ?? []).map((t) => ({
      type: 'transfer' as const,
      id: t.id,
      name: `${t.origin?.name ?? ''} → ${t.destination?.name ?? ''}`,
    })),
  ].map((target) => ({ ...target, key: targetKey(target.type, target.id) }));

  return {
    targets,
    byKey: new Map(targets.map((target) => [target.key, target])),
    isPending: [places, restaurants, items, tickets, hotels, flights, transfers].some(
      (query) => query.isPending,
    ),
  };
}
