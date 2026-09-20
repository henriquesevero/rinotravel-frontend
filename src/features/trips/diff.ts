import type { Trip, UpdateTripRequest } from '@/core/api';

import type { TripFormValues } from './schemas';

type Patch = Omit<UpdateTripRequest, 'baseVersion'>;

/** Only the fields that differ from the server's copy, so a PATCH never overwrites what the user did not touch. */
export function diffTrip(trip: Trip, values: TripFormValues): Patch {
  const patch: Patch = {};
  const name = values.name.trim();
  const destination = values.destination.trim();
  const currency = values.currency.trim().toUpperCase();

  if (name !== trip.name) patch.name = name;
  if (destination !== trip.destination) patch.destination = destination;
  if (values.startDate !== trip.startDate) patch.startDate = values.startDate;
  if (values.endDate !== trip.endDate) patch.endDate = values.endDate;
  if (values.timezone !== trip.timezone) patch.timezone = values.timezone;
  if (currency !== trip.currency) patch.currency = currency;
  return patch;
}

export function toFormValues(trip: Trip): TripFormValues {
  return {
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    timezone: trip.timezone,
    currency: trip.currency,
  };
}
