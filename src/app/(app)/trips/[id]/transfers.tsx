import { useLocalSearchParams } from 'expo-router';

import { TransfersScreen } from '@/features/transfers/TransfersScreen';

export default function TransfersRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransfersScreen tripId={String(id)} />;
}
