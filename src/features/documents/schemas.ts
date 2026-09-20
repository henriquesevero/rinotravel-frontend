import { z } from 'zod';

import { requiredText } from '@/features/content/schemas';

export const DOCUMENT_TYPES = [
  'TICKET',
  'RESERVATION',
  'BOARDING_PASS',
  'HOTEL',
  'INSURANCE',
  'RECEIPT',
  'PASSPORT',
  'OTHER',
] as const;
export const VISIBILITIES = ['TRIP', 'PRIVATE'] as const;

export const documentSchema = z.object({
  name: requiredText(200),
  type: z.enum(DOCUMENT_TYPES),
  visibility: z.enum(VISIBILITIES),
});
export type DocumentFormValues = z.infer<typeof documentSchema>;

export function formatSize(bytes: number): {
  key: 'documents.sizeMb' | 'documents.sizeKb';
  value: string;
} {
  return bytes >= 1024 * 1024
    ? { key: 'documents.sizeMb', value: (bytes / (1024 * 1024)).toFixed(1) }
    : { key: 'documents.sizeKb', value: String(Math.max(1, Math.round(bytes / 1024))) };
}
