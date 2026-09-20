import type { DocumentType, ItineraryCategory, TimelineEntry, TransferMode } from '@/core/api';
import type { Tint } from '@/shared/theme';
import type { IconName } from '@/shared/ui';

export interface Visual {
  icon: IconName;
  tint: Tint;
}

/** One colour and icon per kind of thing, so a list can be read by shape and colour before words. */
export const CATEGORY_VISUAL: Record<ItineraryCategory, Visual> = {
  ATTRACTION: { icon: 'camera-outline', tint: 'violet' },
  RESTAURANT: { icon: 'restaurant-outline', tint: 'orange' },
  SHOPPING: { icon: 'bag-handle-outline', tint: 'pink' },
  FREE_TIME: { icon: 'cafe-outline', tint: 'teal' },
  OTHER: { icon: 'flag-outline', tint: 'slate' },
};

const KIND_VISUAL: Record<Exclude<TimelineEntry['kind'], 'itinerary_item'>, Visual> = {
  flight_departure: { icon: 'airplane-outline', tint: 'sky' },
  flight_arrival: { icon: 'airplane-outline', tint: 'sky' },
  hotel_check_in: { icon: 'bed-outline', tint: 'indigo' },
  hotel_check_out: { icon: 'bed-outline', tint: 'indigo' },
  transfer: { icon: 'swap-horizontal-outline', tint: 'green' },
  restaurant_reservation: { icon: 'restaurant-outline', tint: 'orange' },
};

export function entryVisual(entry: TimelineEntry): Visual {
  if (entry.kind === 'itinerary_item') {
    return CATEGORY_VISUAL[entry.subtitle as ItineraryCategory] ?? CATEGORY_VISUAL.OTHER;
  }
  return KIND_VISUAL[entry.kind];
}

export const MODE_VISUAL: Record<TransferMode, Visual> = {
  WALKING: { icon: 'walk-outline', tint: 'teal' },
  SUBWAY: { icon: 'subway-outline', tint: 'blue' },
  TRAIN: { icon: 'train-outline', tint: 'indigo' },
  BUS: { icon: 'bus-outline', tint: 'orange' },
  TAXI: { icon: 'car-outline', tint: 'amber' },
  RIDESHARE: { icon: 'car-outline', tint: 'violet' },
  CAR: { icon: 'car-sport-outline', tint: 'slate' },
  OTHER: { icon: 'swap-horizontal-outline', tint: 'slate' },
};

export const DOCUMENT_VISUAL: Record<DocumentType, Visual> = {
  TICKET: { icon: 'ticket-outline', tint: 'amber' },
  RESERVATION: { icon: 'bookmark-outline', tint: 'blue' },
  BOARDING_PASS: { icon: 'airplane-outline', tint: 'sky' },
  HOTEL: { icon: 'bed-outline', tint: 'indigo' },
  INSURANCE: { icon: 'shield-checkmark-outline', tint: 'green' },
  RECEIPT: { icon: 'receipt-outline', tint: 'slate' },
  PASSPORT: { icon: 'id-card-outline', tint: 'violet' },
  OTHER: { icon: 'document-outline', tint: 'slate' },
};
