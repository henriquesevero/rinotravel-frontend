import { z } from 'zod';

import { isCivilDate } from '@/core/datetime/civil-date';
import { parseMoneyInput } from '@/core/datetime/money';
import { joinZoned, minutesBetween } from '@/core/datetime/zoned';
import {
  optionalMoney,
  optionalText,
  optionalTime,
  optionalUrl,
  required,
  requiredText,
  requiredTime,
} from '@/features/content/schemas';

const civilDate = z
  .string()
  .min(1, required)
  .refine(isCivilDate, { error: 'validation.dateInvalid' });
const iata = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, { error: 'validation.airportCode' });

/** A price is a number in the currency picked beside it, which may not be the trip's. */
function costIsValid(value: { cost: string; costCurrency: string }): boolean {
  return (
    value.cost.trim() === '' || parseMoneyInput(value.cost, value.costCurrency || 'USD') !== null
  );
}

export const flightSchema = z
  .object({
    airline: optionalText(100),
    flightNumber: requiredText(20),
    from: iata,
    to: iata,
    depDate: civilDate,
    depTime: requiredTime,
    depTimezone: z.string().min(1, required),
    arrDate: civilDate,
    arrTime: requiredTime,
    arrTimezone: z.string().min(1, required),
    terminal: optionalText(20),
    gate: optionalText(20),
    seat: optionalText(20),
    baggage: optionalText(100),
    bookingCode: optionalText(50),
    cost: z.string().default(''),
    costCurrency: z.string().default(''),
    notes: optionalText(2000),
  })
  .refine(costIsValid, { path: ['cost'], error: 'validation.moneyInvalid' })
  .refine(
    (f) => {
      const departure = joinZoned(f.depDate, f.depTime, f.depTimezone);
      const arrival = joinZoned(f.arrDate, f.arrTime, f.arrTimezone);
      const minutes = minutesBetween(departure, arrival);
      // A value we cannot compute is left to the server; only a real negative flight is rejected here.
      return Number.isNaN(minutes) || minutes > 0;
    },
    { path: ['arrTime'], error: 'validation.arrivalBeforeDeparture' },
  );
export type FlightFormValues = z.infer<typeof flightSchema>;
export const FLIGHT_FIELDS = [
  'airline',
  'flightNumber',
  'from',
  'to',
  'depDate',
  'depTime',
  'depTimezone',
  'arrDate',
  'arrTime',
  'arrTimezone',
  'terminal',
  'gate',
  'seat',
  'baggage',
  'bookingCode',
  'cost',
  'costCurrency',
  'notes',
] as const;
export const FLIGHT_ALIASES = {
  departureAirport: 'from',
  arrivalAirport: 'to',
  departure: 'depTime',
  arrival: 'arrTime',
} as const;

export const hotelSchema = z
  .object({
    name: requiredText(200),
    address: optionalText(300),
    checkInDate: civilDate,
    checkInTime: requiredTime,
    checkOutDate: civilDate,
    checkOutTime: requiredTime,
    confirmationCode: optionalText(50),
    contactPhone: optionalText(50),
    bookingUrl: optionalUrl,
    cost: z.string().default(''),
    costCurrency: z.string().default(''),
    notes: optionalText(2000),
  })
  .refine(costIsValid, { path: ['cost'], error: 'validation.moneyInvalid' })
  .refine((h) => `${h.checkOutDate}T${h.checkOutTime}` > `${h.checkInDate}T${h.checkInTime}`, {
    path: ['checkOutTime'],
    error: 'validation.checkoutBeforeCheckin',
  });
export type HotelFormValues = z.infer<typeof hotelSchema>;
export const HOTEL_FIELDS = [
  'name',
  'address',
  'checkInDate',
  'checkInTime',
  'checkOutDate',
  'checkOutTime',
  'confirmationCode',
  'contactPhone',
  'bookingUrl',
  'cost',
  'costCurrency',
  'notes',
] as const;
export const HOTEL_ALIASES = {
  location: 'address',
  checkIn: 'checkInTime',
  checkOut: 'checkOutTime',
} as const;

export const TICKET_KINDS = [
  'ATTRACTION',
  'SHOW',
  'MUSEUM',
  'SPORT',
  'TOUR',
  'TRANSPORT',
  'OTHER',
] as const;
export const TICKET_STATUSES = ['PLANNED', 'CONFIRMED', 'COMPLETED', 'SKIPPED'] as const;

export function ticketSchema(currency: string) {
  return (
    z
      .object({
        name: requiredText(200),
        kind: z.enum(TICKET_KINDS),
        quantity: z
          .string()
          .trim()
          .refine((value) => /^\d{1,3}$/.test(value) && Number(value) >= 1, {
            error: 'validation.quantityInvalid',
          }),
        venue: optionalText(200),
        address: optionalText(300),
        date: z.string().refine((value) => value === '' || isCivilDate(value), {
          error: 'validation.dateInvalid',
        }),
        startTime: optionalTime,
        endTime: optionalTime,
        confirmationCode: optionalText(100),
        seat: optionalText(100),
        cost: optionalMoney(currency),
        status: z.enum(TICKET_STATUSES),
        notes: optionalText(2000),
      })
      // A time needs a day, and the end needs a start; the server enforces the same.
      .refine((t) => (t.date === '') === (t.startTime === ''), {
        path: ['startTime'],
        error: 'validation.required',
      })
      .refine((t) => t.endTime === '' || t.startTime !== '', {
        path: ['endTime'],
        error: 'validation.required',
      })
      .refine((t) => t.endTime === '' || t.startTime === '' || t.endTime >= t.startTime, {
        path: ['endTime'],
        error: 'validation.ticketEndBeforeStart',
      })
  );
}
export type TicketFormValues = z.infer<ReturnType<typeof ticketSchema>>;
export const TICKET_FIELDS = [
  'name',
  'kind',
  'quantity',
  'venue',
  'address',
  'date',
  'startTime',
  'endTime',
  'confirmationCode',
  'seat',
  'cost',
  'status',
  'notes',
] as const;
export const TICKET_ALIASES = {
  location: 'address',
  start: 'startTime',
  end: 'endTime',
} as const;
