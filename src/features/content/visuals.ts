import type {
  DocumentType,
  ExpenseCategory,
  ItineraryCategory,
  TicketKind,
  TimelineEntry,
} from '@/core/api';
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
  restaurant_reservation: { icon: 'restaurant-outline', tint: 'orange' },
  ticket: { icon: 'ticket-outline', tint: 'amber' },
};

export function entryVisual(entry: TimelineEntry): Visual {
  if (entry.kind === 'itinerary_item') {
    return CATEGORY_VISUAL[entry.subtitle as ItineraryCategory] ?? CATEGORY_VISUAL.OTHER;
  }
  if (entry.kind === 'ticket') {
    return TICKET_VISUAL[entry.subtitle as TicketKind] ?? KIND_VISUAL.ticket;
  }
  return KIND_VISUAL[entry.kind];
}

export const TICKET_VISUAL: Record<TicketKind, Visual> = {
  ATTRACTION: { icon: 'ticket-outline', tint: 'amber' },
  SHOW: { icon: 'musical-notes-outline', tint: 'pink' },
  MUSEUM: { icon: 'business-outline', tint: 'violet' },
  SPORT: { icon: 'football-outline', tint: 'green' },
  TOUR: { icon: 'compass-outline', tint: 'teal' },
  TRANSPORT: { icon: 'bus-outline', tint: 'orange' },
  OTHER: { icon: 'ticket-outline', tint: 'slate' },
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

export const EXPENSE_VISUAL: Record<ExpenseCategory, Visual> = {
  FOOD: { icon: 'restaurant-outline', tint: 'orange' },
  LODGING: { icon: 'bed-outline', tint: 'indigo' },
  TRANSPORT: { icon: 'car-outline', tint: 'green' },
  ACTIVITIES: { icon: 'sparkles-outline', tint: 'violet' },
  SOUVENIRS: { icon: 'gift-outline', tint: 'pink' },
  CLOTHES: { icon: 'shirt-outline', tint: 'sky' },
  ELECTRONICS: { icon: 'game-controller-outline', tint: 'blue' },
  OTHER: { icon: 'ellipsis-horizontal-circle-outline', tint: 'slate' },
};
