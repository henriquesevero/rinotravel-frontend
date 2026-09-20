import { z } from 'zod';

import {
  optionalMoney,
  optionalText,
  optionalTime,
  required,
  requiredText,
} from '@/features/content/schemas';

export const CATEGORIES = ['ATTRACTION', 'RESTAURANT', 'SHOPPING', 'FREE_TIME', 'OTHER'] as const;
export const STATUSES = ['PLANNED', 'CONFIRMED', 'COMPLETED', 'SKIPPED'] as const;

export function itemSchema(currency: string) {
  return z
    .object({
      title: requiredText(200),
      date: z.string().min(1, required),
      startTime: optionalTime,
      endTime: optionalTime,
      category: z.enum(CATEGORIES),
      status: z.enum(STATUSES),
      locationName: optionalText(200),
      address: optionalText(300),
      cost: optionalMoney(currency),
      notes: optionalText(2000),
    })
    .refine((item) => !item.startTime || !item.endTime || item.endTime >= item.startTime, {
      path: ['endTime'],
      error: 'validation.timeOrder',
    });
}

export type ItemFormValues = z.infer<ReturnType<typeof itemSchema>>;

export const ITEM_FIELDS = [
  'title',
  'date',
  'startTime',
  'endTime',
  'category',
  'status',
  'locationName',
  'address',
  'cost',
  'notes',
] as const;

export const ITEM_ALIASES = {
  dayId: 'date',
  start: 'startTime',
  end: 'endTime',
  location: 'locationName',
  estimatedCost: 'cost',
} as const;
