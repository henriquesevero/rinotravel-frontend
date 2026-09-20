import { z } from 'zod';

import { isCivilDate } from '@/core/datetime/civil-date';

// Messages are i18n keys, translated by the form layer.
const required = { error: 'validation.required' } as const;

const text = z.string().trim().min(1, required).max(100, { error: 'validation.nameMax' });

const date = z.string().min(1, required).refine(isCivilDate, { error: 'validation.dateInvalid' });

export const tripFormSchema = z
  .object({
    name: text,
    destination: text,
    startDate: date,
    endDate: date,
    timezone: z.string().min(1, required),
    currency: z.string().min(1, required),
  })
  .refine(
    (trip) =>
      !isCivilDate(trip.startDate) || !isCivilDate(trip.endDate) || trip.endDate >= trip.startDate,
    { path: ['endDate'], error: 'validation.endBeforeStart' },
  );

export type TripFormValues = z.infer<typeof tripFormSchema>;

export const TRIP_FORM_FIELDS = [
  'name',
  'destination',
  'startDate',
  'endDate',
  'timezone',
  'currency',
] as const;
