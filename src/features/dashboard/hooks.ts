import { flightHooks, hotelHooks, ticketHooks } from '@/features/bookings/hooks';
import { useDocuments } from '@/features/documents/hooks';
import { useTimeline } from '@/features/itinerary/hooks';
import { placeHooks, restaurantHooks } from '@/features/places/hooks';

/** Everything a trip summary shows, from queries the section screens share, so nothing is fetched twice. */
export function useTripSnapshot(tripId: string) {
  const timeline = useTimeline(tripId);
  const places = placeHooks.useList(tripId);
  const restaurants = restaurantHooks.useList(tripId);
  const flights = flightHooks.useList(tripId);
  const hotels = hotelHooks.useList(tripId);
  const tickets = ticketHooks.useList(tripId);
  const documents = useDocuments(tripId);

  return {
    timeline,
    counts: {
      places: (places.data?.length ?? 0) + (restaurants.data?.length ?? 0),
      bookings:
        (flights.data?.length ?? 0) + (hotels.data?.length ?? 0) + (tickets.data?.length ?? 0),
      documents: documents.data?.filter((document) => document.status === 'READY').length ?? 0,
    },
    isPending: timeline.isPending,
    refetch: () => {
      void timeline.refetch();
      void places.refetch();
      void restaurants.refetch();
      void flights.refetch();
      void hotels.refetch();
      void tickets.refetch();
      void documents.refetch();
    },
  };
}
