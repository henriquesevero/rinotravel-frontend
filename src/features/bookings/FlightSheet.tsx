import { currencyOptions, timezoneOptions } from '@/features/trips/options';
import { useMemo } from 'react';

import type { Flight } from '@/core/api';
import { joinZoned, splitZoned } from '@/core/datetime/zoned';
import { useTranslation } from '@/core/i18n';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { useEntityForm } from '@/features/content/use-entity-form';
import {
  FormDateField,
  FormSelectField,
  FormTextField,
  FormTimeField,
  useConfirm,
  FormSection,
  FieldRow,
} from '@/shared/ui';

import { flightHooks } from './hooks';
import { fromMoney, toMoneyInput } from '@/features/content/mappers';
import { FLIGHT_ALIASES, FLIGHT_FIELDS, flightSchema, type FlightFormValues } from './schemas';

interface FlightSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  /** Where the trip happens; the arrival is assumed to be there. */
  tripTimezone: string;
  homeTimezone: string;
  /** The trip's currency, offered first for the price. */
  currency: string;
  flight?: Flight | undefined;
}

export function FlightSheet({
  tripId,
  visible,
  onClose,
  tripTimezone,
  homeTimezone,
  currency,
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
      cost: fromMoney(flight?.cost),
      costCurrency: flight?.cost?.currency ?? currency,
      notes: flight?.notes ?? '',
    };
  }, [flight, homeTimezone, tripTimezone, currency]);
  const { form, error, fail, close, clearError } = useEntityForm<FlightFormValues>({
    schema: flightSchema,
    defaults,
    fields: FLIGHT_FIELDS,
    aliases: FLIGHT_ALIASES,
    onClose,
  });

  const zones = useMemo(() => timezoneOptions(homeTimezone), [homeTimezone]);
  const currencies = useMemo(
    () => currencyOptions((code) => t(`currencies.${code}`), currency),
    [currency, t],
  );

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
      cost: toMoneyInput(values.cost, values.costCurrency),
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
      icon="airplane-outline"
      tint="sky"
      testID="flight-sheet"
      visible={visible}
      title={flight ? t('bookings.editFlight') : t('bookings.addFlight')}
      onClose={close}
      onSubmit={() => void submit()}
      isSubmitting={create.isPending || update.isPending}
      error={error}
      {...(flight ? { onDelete: () => void askDelete() } : {})}
    >
      <FormSection title={t('content.sec.basic')}>
        <FieldRow>
          <FormTextField control={control} name="airline" label={t('bookings.airline')} />
          <FormTextField
            control={control}
            name="flightNumber"
            label={t('bookings.flightNumber')}
            autoCapitalize="characters"
            testID="flight-number"
          />
        </FieldRow>
        <FieldRow>
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
        </FieldRow>
      </FormSection>
      <FormSection title={t('bookings.departure')}>
        <FieldRow>
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
        </FieldRow>
        {zoneField('depTimezone')}
      </FormSection>
      <FormSection title={t('bookings.arrival')}>
        <FieldRow>
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
        </FieldRow>
        {zoneField('arrTimezone')}
      </FormSection>
      <FormSection title={t('content.sec.booking')}>
        <FieldRow>
          <FormTextField control={control} name="terminal" label={t('bookings.terminal')} />
          <FormTextField control={control} name="gate" label={t('bookings.gate')} />
          <FormTextField control={control} name="seat" label={t('bookings.seat')} />
        </FieldRow>
        <FieldRow>
          <FormTextField control={control} name="baggage" label={t('bookings.baggage')} />
          <FormTextField
            control={control}
            name="bookingCode"
            label={t('bookings.bookingCode')}
            autoCapitalize="characters"
          />
        </FieldRow>
        <FieldRow>
          <FormTextField
            control={control}
            name="cost"
            label={t('bookings.price')}
            keyboardType="decimal-pad"
            testID="flight-cost"
          />
          <FormSelectField
            control={control}
            name="costCurrency"
            label={t('bookings.priceCurrency')}
            title={t('bookings.priceCurrency')}
            options={currencies}
            searchable
          />
        </FieldRow>
        <FormTextField control={control} name="notes" label={t('content.notes')} multiline />
      </FormSection>
    </EntitySheet>
  );
}
