import { useLocalSearchParams } from 'expo-router';

import { ChecklistScreen } from '@/features/checklist/ChecklistScreen';

export default function ChecklistRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChecklistScreen tripId={String(id)} />;
}
