import { useLocalSearchParams } from 'expo-router';

import { DocumentsScreen } from '@/features/documents/DocumentsScreen';

export default function DocumentsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DocumentsScreen tripId={String(id)} />;
}
