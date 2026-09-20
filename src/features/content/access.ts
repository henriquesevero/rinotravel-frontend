import { useTrip } from '@/features/trips';

/** What the current person may do in a trip and the defaults its forms start from. */
export function useTripAccess(tripId: string) {
  const query = useTrip(tripId);
  const trip = query.data;
  return {
    query,
    trip,
    canWrite: trip?.capabilities.writeContent ?? false,
    currency: trip?.currency ?? 'USD',
    timezone: trip?.timezone ?? 'UTC',
  };
}
