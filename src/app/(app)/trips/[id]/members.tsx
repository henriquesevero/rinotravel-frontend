import { useLocalSearchParams } from 'expo-router';

import { MembersScreen } from '@/features/trips';

export default function MembersRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MembersScreen tripId={String(id)} />;
}
