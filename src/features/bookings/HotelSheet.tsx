import { useMemo } from 'react';

import type { Hotel } from '@/core/api';
import { joinZoned, splitZoned } from '@/core/datetime/zoned';
import { useTranslation } from '@/core/i18n';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { mergeLocation } from '@/features/content/mappers';
import { useEntityForm } from '@/features/content/use-entity-form';
import {
  FormDateField,
  FormTextField,
  FormTimeField,
  useConfirm,
  FormSection,
  FieldRow,
} from '@/shared/ui';

import { hotelHooks } from './hooks';
import { HOTEL_ALIASES, HOTEL_FIELDS, hotelSchema, type HotelFormValues } from './schemas';

interface HotelSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  timezone: string;
  hotel?: Hotel | undefined;
}

export function HotelSheet({ tripId, visible, onClose, timezone, hotel }: HotelSheetProps) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const create = hotelHooks.useCreate(tripId);
  const update = hotelHooks.useUpdate(tripId);
  const remove = hotelHooks.useRemove(tripId);

  const defaults = useMemo<HotelFormValues>(() => {
    const checkIn = splitZoned(hotel?.checkIn);
    const checkOut = splitZoned(hotel?.checkOut);
    return {
      name: hotel?.name ?? '',
      address: hotel?.location?.address ?? '',
      checkInDate: checkIn.date,
      checkInTime: checkIn.time || '15:00',
      checkOutDate: checkOut.date,
      checkOutTime: checkOut.time || '11:00',
      confirmationCode: hotel?.confirmationCode ?? '',
      contactPhone: hotel?.contactPhone ?? '',
      bookingUrl: hotel?.bookingUrl ?? '',
      notes: hotel?.notes ?? '',
    };
  }, [hotel]);
  const { form, error, fail, close, clearError } = useEntityForm<HotelFormValues>({
    schema: hotelSchema,
    defaults,
    fields: HOTEL_FIELDS,
    aliases: HOTEL_ALIASES,
    onClose,
  });

  const submit = form.handleSubmit(async (values) => {
    clearError();
    const body = {
      name: values.name,
      location: mergeLocation(values.name, values.address, hotel?.location),
      checkIn: joinZoned(values.checkInDate, values.checkInTime, timezone),
      checkOut: joinZoned(values.checkOutDate, values.checkOutTime, timezone),
      confirmationCode: values.confirmationCode,
      contactPhone: values.contactPhone,
      bookingUrl: values.bookingUrl,
      notes: values.notes,
    };
    try {
      if (hotel) {
        await update.mutateAsync({ id: hotel.id, baseVersion: hotel.version, patch: body });
      } else {
        await create.mutateAsync({ id: newId(), ...body });
      }
      close();
    } catch (cause) {
      fail(cause);
    }
  });

  const askDelete = async () => {
    if (!hotel) return;
    const confirmed = await confirm({
      title: t('content.deleteTitle'),
      message: t('content.deleteMessage', { name: hotel.name }),
      confirmLabel: t('content.deleteConfirm'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(hotel.id);
      close();
    } catch (cause) {
      fail(cause);
    }
  };

  const { control } = form;
  return (
    <EntitySheet
      icon="bed-outline"
      tint="indigo"
      testID="hotel-sheet"
      visible={visible}
      title={hotel ? t('bookings.editHotel') : t('bookings.addHotel')}
      onClose={close}
      onSubmit={() => void submit()}
      isSubmitting={create.isPending || update.isPending}
      error={error}
      {...(hotel ? { onDelete: () => void askDelete() } : {})}
    >
      <FormSection title={t('content.sec.basic')}>
        <FormTextField
          control={control}
          name="name"
          label={t('bookings.hotelName')}
          testID="hotel-name"
        />
        <FormTextField control={control} name="address" label={t('content.address')} />
      </FormSection>
      <FormSection title={t('content.sec.when')}>
        <FieldRow>
          <FormDateField
            control={control}
            name="checkInDate"
            label={t('bookings.checkInDate')}
            testID="hotel-in-date"
          />
          <FormTimeField
            control={control}
            name="checkInTime"
            label={t('bookings.checkInTime')}
            hint={t('content.timeHint')}
          />
        </FieldRow>
        <FieldRow>
          <FormDateField
            control={control}
            name="checkOutDate"
            label={t('bookings.checkOutDate')}
            testID="hotel-out-date"
          />
          <FormTimeField control={control} name="checkOutTime" label={t('bookings.checkOutTime')} />
        </FieldRow>
      </FormSection>
      <FormSection title={t('content.sec.booking')}>
        <FieldRow>
          <FormTextField
            control={control}
            name="confirmationCode"
            label={t('bookings.confirmation')}
            autoCapitalize="characters"
          />
          <FormTextField
            control={control}
            name="contactPhone"
            label={t('bookings.phone')}
            keyboardType="phone-pad"
          />
        </FieldRow>
        <FormTextField
          control={control}
          name="bookingUrl"
          label={t('bookings.url')}
          keyboardType="url"
          autoCapitalize="none"
        />
        <FormTextField control={control} name="notes" label={t('content.notes')} multiline />
      </FormSection>
    </EntitySheet>
  );
}
