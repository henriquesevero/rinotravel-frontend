import { z } from 'zod';

import { optionalText, required, requiredText } from '@/features/content/schemas';

export const CATEGORIES = ['DOCUMENTS', 'CLOTHES', 'ELECTRONICS', 'TOILETRIES', 'OTHER'] as const;

const quantityText = z
  .string()
  .trim()
  .min(1, required)
  .refine((value) => /^\d{1,3}$/.test(value) && Number(value) >= 1, {
    error: 'validation.numberInvalid',
  });

export const checklistItemSchema = z.object({
  title: requiredText(200),
  category: z.enum(CATEGORIES),
  quantity: quantityText,
  notes: optionalText(500),
});
export type ChecklistItemFormValues = z.infer<typeof checklistItemSchema>;
export const CHECKLIST_ITEM_FIELDS = ['title', 'category', 'quantity', 'notes'] as const;
