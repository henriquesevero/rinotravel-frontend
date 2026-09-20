import { useLocalSearchParams } from 'expo-router';

import { BookingsScreen } from '@/features/bookings/BookingsScreen';

export default function BookingsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookingsScreen tripId={String(id)} />;
}
