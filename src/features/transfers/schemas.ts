import { z } from 'zod';

import { isCivilDate } from '@/core/datetime/civil-date';
import {
  optionalInt,
  optionalMoney,
  optionalText,
  optionalTime,
  required,
  requiredText,
} from '@/features/content/schemas';

export const MODES = [
  'WALKING',
  'SUBWAY',
  'TRAIN',
  'BUS',
  'TAXI',
  'RIDESHARE',
  'CAR',
  'OTHER',
] as const;
export const STATUSES = ['PLANNED', 'CONFIRMED', 'COMPLETED', 'SKIPPED'] as const;

export function transferSchema(currency: string) {
  return z
    .object({
      origin: requiredText(300),
      destination: requiredText(300),
      mode: z.enum(MODES),
      status: z.enum(STATUSES),
      date: z.string().refine((value) => value === '' || isCivilDate(value), {
        error: 'validation.dateInvalid',
      }),
      departTime: optionalTime,
      arriveTime: optionalTime,
      duration: optionalInt,
      line: optionalText(100),
      instructions: optionalText(1000),
      cost: optionalMoney(currency),
      notes: optionalText(2000),
    })
    .refine((t) => (t.departTime === '' && t.arriveTime === '') || t.date !== '', {
      path: ['date'],
      error: 'validation.required',
    })
    .refine((t) => !t.departTime || !t.arriveTime || t.arriveTime >= t.departTime, {
      path: ['arriveTime'],
      error: 'validation.timeOrder',
    });
}
export type TransferFormValues = z.infer<ReturnType<typeof transferSchema>>;
export const TRANSFER_FIELDS = [
  'origin',
  'destination',
  'mode',
  'status',
  'date',
  'departTime',
  'arriveTime',
  'duration',
  'line',
  'instructions',
  'cost',
  'notes',
] as const;
export const TRANSFER_ALIASES = {
  legs: 'mode',
  status: 'status',
  estimatedDurationMinutes: 'duration',
  departure: 'departTime',
  arrival: 'arriveTime',
  cost: 'cost',
} as const;

export { required };
