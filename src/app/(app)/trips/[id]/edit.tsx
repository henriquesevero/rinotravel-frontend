import { useLocalSearchParams } from 'expo-router';

import { EditTripScreen } from '@/features/trips';

export default function EditTripRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditTripScreen tripId={String(id)} />;
}
