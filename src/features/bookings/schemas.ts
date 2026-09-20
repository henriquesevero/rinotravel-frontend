import { z } from 'zod';

import { isCivilDate } from '@/core/datetime/civil-date';
import { joinZoned, minutesBetween } from '@/core/datetime/zoned';
import {
  optionalText,
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
    notes: optionalText(2000),
  })
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
    notes: optionalText(2000),
  })
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
  'notes',
] as const;
export const HOTEL_ALIASES = {
  location: 'address',
  checkIn: 'checkInTime',
  checkOut: 'checkOutTime',
} as const;
