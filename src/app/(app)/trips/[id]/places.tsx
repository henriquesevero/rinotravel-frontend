import { useLocalSearchParams } from 'expo-router';

import { PlacesScreen } from '@/features/places/PlacesScreen';

export default function PlacesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlacesScreen tripId={String(id)} />;
}
