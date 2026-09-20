import { useMemo } from 'react';

import type { Flight } from '@/core/api';
import { joinZoned, splitZoned } from '@/core/datetime/zoned';
import { useTranslation } from '@/core/i18n';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { useEntityForm } from '@/features/content/use-entity-form';
import { timezoneOptions } from '@/features/trips/options';
import {
  FormDateField,
  FormSelectField,
  FormTextField,
  FormTimeField,
  useConfirm,
} from '@/shared/ui';

import { flightHooks } from './hooks';
import { FLIGHT_ALIASES, FLIGHT_FIELDS, flightSchema, type FlightFormValues } from './schemas';

interface FlightSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  /** Where the trip happens; the arrival is assumed to be there. */
  tripTimezone: string;
  homeTimezone: string;
  flight?: Flight | undefined;
}

export function FlightSheet({
  tripId,
  visible,
  onClose,
  tripTimezone,
  homeTimezone,
  flight,
}: FlightSheetProps) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const create = flightHooks.useCreate(tripId);
  const update = flightHooks.useUpdate(tripId);
  const remove = flightHooks.useRemove(tripId);

  const defaults = useMemo<FlightFormValues>(() => {
    const dep = splitZoned(flight?.departure);
    const arr = splitZoned(flight?.arrival);
    return {
      airline: flight?.airline ?? '',
      flightNumber: flight?.flightNumber ?? '',
      from: flight?.departureAirport ?? '',
      to: flight?.arrivalAirport ?? '',
      depDate: dep.date,
      depTime: dep.time,
      depTimezone: flight?.departure.timezone ?? homeTimezone,
      arrDate: arr.date,
      arrTime: arr.time,
      arrTimezone: flight?.arrival.timezone ?? tripTimezone,
      terminal: flight?.terminal ?? '',
      gate: flight?.gate ?? '',
      seat: flight?.seat ?? '',
      baggage: flight?.baggage ?? '',
      bookingCode: flight?.bookingCode ?? '',
      notes: flight?.notes ?? '',
    };
  }, [flight, homeTimezone, tripTimezone]);
  const { form, error, fail, close, clearError } = useEntityForm<FlightFormValues>({
    schema: flightSchema,
    defaults,
    fields: FLIGHT_FIELDS,
    aliases: FLIGHT_ALIASES,
    onClose,
  });

  const zones = useMemo(() => timezoneOptions(homeTimezone), [homeTimezone]);

  const submit = form.handleSubmit(async (values) => {
    clearError();
    const body = {
      airline: values.airline,
      flightNumber: values.flightNumber.toUpperCase().replace(/\s+/g, ''),
      departureAirport: values.from.toUpperCase(),
      arrivalAirport: values.to.toUpperCase(),
      departure: joinZoned(values.depDate, values.depTime, values.depTimezone),
      arrival: joinZoned(values.arrDate, values.arrTime, values.arrTimezone),
      terminal: values.terminal,
      gate: values.gate,
      seat: values.seat,
      baggage: values.baggage,
      bookingCode: values.bookingCode,
      notes: values.notes,
    };
    try {
      if (flight) {
        await update.mutateAsync({ id: flight.id, baseVersion: flight.version, patch: body });
      } else {
        await create.mutateAsync({ id: newId(), ...body });
      }
      close();
    } catch (cause) {
      fail(cause);
    }
  });

  const askDelete = async () => {
    if (!flight) return;
    const confirmed = await confirm({
      title: t('content.deleteTitle'),
      message: t('content.deleteMessage', { name: flight.flightNumber }),
      confirmLabel: t('content.deleteConfirm'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(flight.id);
      close();
    } catch (cause) {
      fail(cause);
    }
  };

  const { control } = form;
  const zoneField = (name: 'depTimezone' | 'arrTimezone') => (
    <FormSelectField
      control={control}
      name={name}
      label={t('content.timezone')}
      title={t('content.pickTimezone')}
      options={zones}
      searchable
    />
  );

  return (
    <EntitySheet
      testID="flight-sheet"
      visible={visible}
      title={flight ? t('bookings.editFlight') : t('bookings.addFlight')}
      onClose={close}
      onSubmit={() => void submit()}
      isSubmitting={create.isPending || update.isPending}
      error={error}
      {...(flight ? { onDelete: () => void askDelete() } : {})}
    >
      <FormTextField control={control} name="airline" label={t('bookings.airline')} />
      <FormTextField
        control={control}
        name="flightNumber"
        label={t('bookings.flightNumber')}
        autoCapitalize="characters"
        testID="flight-number"
      />
      <FormTextField
        control={control}
        name="from"
        label={t('bookings.from')}
        autoCapitalize="characters"
        maxLength={3}
        testID="flight-from"
      />
      <FormTextField
        control={control}
        name="to"
        label={t('bookings.to')}
        autoCapitalize="characters"
        maxLength={3}
        testID="flight-to"
      />
      <FormDateField
        control={control}
        name="depDate"
        label={t('bookings.depDate')}
        testID="flight-dep-date"
      />
      <FormTimeField
        control={control}
        name="depTime"
        label={t('bookings.depTime')}
        hint={t('content.timeHint')}
        testID="flight-dep-time"
      />
      {zoneField('depTimezone')}
      <FormDateField
        control={control}
        name="arrDate"
        label={t('bookings.arrDate')}
        testID="flight-arr-date"
      />
      <FormTimeField
        control={control}
        name="arrTime"
        label={t('bookings.arrTime')}
        hint={t('content.timeHint')}
        testID="flight-arr-time"
      />
      {zoneField('arrTimezone')}
      <FormTextField control={control} name="terminal" label={t('bookings.terminal')} />
      <FormTextField control={control} name="gate" label={t('bookings.gate')} />
      <FormTextField control={control} name="seat" label={t('bookings.seat')} />
      <FormTextField control={control} name="baggage" label={t('bookings.baggage')} />
      <FormTextField
        control={control}
        name="bookingCode"
        label={t('bookings.bookingCode')}
        autoCapitalize="characters"
      />
      <FormTextField control={control} name="notes" label={t('content.notes')} multiline />
    </EntitySheet>
  );
}
