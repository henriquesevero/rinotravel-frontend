import { useLocalSearchParams } from 'expo-router';

import { TripScreen } from '@/features/trips';

export default function TripRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TripScreen tripId={String(id)} />;
}
