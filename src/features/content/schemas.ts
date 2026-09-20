import { z } from 'zod';

import { parseMoneyInput } from '@/core/datetime/money';
import { isTime } from '@/core/datetime/zoned';

export const required = { error: 'validation.required' } as const;

export const requiredText = (max: number) =>
  z.string().trim().min(1, required).max(max, { error: 'validation.nameMax' });

export const optionalText = (max = 500) =>
  z.string().trim().max(max, { error: 'validation.nameMax' });

export const requiredTime = z.string().refine(isTime, { error: 'validation.timeInvalid' });

export const optionalTime = z
  .string()
  .refine((value) => value === '' || isTime(value), { error: 'validation.timeInvalid' });

export const optionalMoney = (currency: string) =>
  z.string().refine((value) => value.trim() === '' || parseMoneyInput(value, currency) !== null, {
    error: 'validation.moneyInvalid',
  });

export const optionalInt = z
  .string()
  .refine((value) => value.trim() === '' || /^\d{1,5}$/.test(value.trim()), {
    error: 'validation.numberInvalid',
  });

export const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || /^https?:\/\/\S+$/i.test(value), {
    error: 'validation.urlInvalid',
  });
