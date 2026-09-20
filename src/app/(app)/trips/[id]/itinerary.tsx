import { useLocalSearchParams } from 'expo-router';

import { ItineraryScreen } from '@/features/itinerary/ItineraryScreen';

export default function ItineraryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ItineraryScreen tripId={String(id)} />;
}
