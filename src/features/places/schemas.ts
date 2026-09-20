import { z } from 'zod';

import {
  optionalInt,
  optionalMoney,
  optionalText,
  optionalTime,
  requiredText,
} from '@/features/content/schemas';

export const PLACE_CATEGORIES = ['ATTRACTION', 'RESTAURANT', 'SHOPPING', 'OTHER'] as const;
export const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;
export const RESTAURANT_STATUSES = ['WISHLIST', 'PLANNED', 'RESERVED', 'VISITED'] as const;

export function placeSchema(currency: string) {
  return z.object({
    name: requiredText(200),
    category: z.enum(PLACE_CATEGORIES),
    priority: z.enum(PRIORITIES),
    address: optionalText(300),
    duration: optionalInt,
    cost: optionalMoney(currency),
    notes: optionalText(2000),
  });
}
export type PlaceFormValues = z.infer<ReturnType<typeof placeSchema>>;
export const PLACE_FIELDS = [
  'name',
  'category',
  'priority',
  'address',
  'duration',
  'cost',
  'notes',
] as const;
export const PLACE_ALIASES = {
  location: 'address',
  estimatedDurationMinutes: 'duration',
  estimatedCost: 'cost',
} as const;

export function restaurantSchema(currency: string) {
  return z
    .object({
      name: requiredText(200),
      cuisine: optionalText(100),
      status: z.enum(RESTAURANT_STATUSES),
      address: optionalText(300),
      reservationDate: z.string(),
      reservationTime: optionalTime,
      reservationCode: optionalText(100),
      dishes: optionalText(500),
      cost: optionalMoney(currency),
      notes: optionalText(2000),
    })
    .refine((r) => (r.reservationDate === '') === (r.reservationTime === ''), {
      path: ['reservationTime'],
      error: 'validation.required',
    });
}
export type RestaurantFormValues = z.infer<ReturnType<typeof restaurantSchema>>;
export const RESTAURANT_FIELDS = [
  'name',
  'cuisine',
  'status',
  'address',
  'reservationDate',
  'reservationTime',
  'reservationCode',
  'dishes',
  'cost',
  'notes',
] as const;
export const RESTAURANT_ALIASES = {
  location: 'address',
  reservationAt: 'reservationTime',
  desiredDishes: 'dishes',
  estimatedCost: 'cost',
} as const;

export const scheduleSchema = z.object({
  date: z.string().min(1, { error: 'validation.required' }),
  startTime: optionalTime,
});
export type ScheduleFormValues = z.infer<typeof scheduleSchema>;
