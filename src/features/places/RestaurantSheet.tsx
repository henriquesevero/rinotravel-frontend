import { useMemo, useState } from 'react';

import type { Location, PlaceCandidate, Restaurant } from '@/core/api';
import { joinOptionalZoned, splitZoned } from '@/core/datetime/zoned';
import { useTranslation } from '@/core/i18n';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { PlaceSearch } from '@/features/content/PlaceSearch';
import { fromMoney, mergeLocation, splitList, toMoneyInput } from '@/features/content/mappers';
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

import { restaurantHooks } from './hooks';
import {
  RESTAURANT_ALIASES,
  RESTAURANT_FIELDS,
  RESTAURANT_STATUSES,
  restaurantSchema,
  type RestaurantFormValues,
} from './schemas';

interface RestaurantSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  currency: string;
  timezone: string;
  restaurant?: Restaurant | undefined;
}

export function RestaurantSheet({
  tripId,
  visible,
  onClose,
  currency,
  timezone,
  restaurant,
}: RestaurantSheetProps) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const create = restaurantHooks.useCreate(tripId);
  const update = restaurantHooks.useUpdate(tripId);
  const remove = restaurantHooks.useRemove(tripId);
  const [picked, setPicked] = useState<PlaceCandidate | null>(null);

  const schema = useMemo(() => restaurantSchema(currency), [currency]);
  const defaults = useMemo<RestaurantFormValues>(() => {
    const reservation = splitZoned(restaurant?.reservationAt);
    return {
      name: restaurant?.name ?? '',
      cuisine: restaurant?.cuisine ?? '',
      status: restaurant?.status ?? 'WISHLIST',
      address: restaurant?.location?.address ?? '',
      reservationDate: reservation.date,
      reservationTime: reservation.time,
      reservationCode: restaurant?.reservationCode ?? '',
      dishes: restaurant?.desiredDishes.join(', ') ?? '',
      cost: fromMoney(restaurant?.estimatedCost),
      notes: restaurant?.notes ?? '',
    };
  }, [restaurant]);
  const { form, error, fail, close, clearError } = useEntityForm<RestaurantFormValues>({
    schema,
    defaults,
    fields: RESTAURANT_FIELDS,
    aliases: RESTAURANT_ALIASES,
    onClose: () => {
      setPicked(null);
      onClose();
    },
  });

  const pick = (candidate: PlaceCandidate) => {
    setPicked(candidate);
    form.setValue('name', candidate.name, { shouldValidate: true });
    form.setValue('address', candidate.address ?? '');
  };

  const submit = form.handleSubmit(async (values) => {
    clearError();
    const pickedLocation: Location | undefined = picked
      ? {
          name: picked.name,
          ...(picked.address ? { address: picked.address } : {}),
          ...(picked.latitude !== undefined ? { latitude: picked.latitude } : {}),
          ...(picked.longitude !== undefined ? { longitude: picked.longitude } : {}),
        }
      : restaurant?.location;
    const body = {
      name: values.name,
      cuisine: values.cuisine,
      status: values.status,
      notes: values.notes,
      reservationCode: values.reservationCode,
      desiredDishes: splitList(values.dishes),
      location: mergeLocation(values.name, values.address, pickedLocation),
      estimatedCost: toMoneyInput(values.cost, currency),
      reservationAt: joinOptionalZoned(values.reservationDate, values.reservationTime, timezone),
      ...(picked ? { externalId: picked.providerId } : {}),
    };
    try {
      if (restaurant) {
        await update.mutateAsync({
          id: restaurant.id,
          baseVersion: restaurant.version,
          patch: body,
        });
      } else {
        await create.mutateAsync({ id: newId(), ...body });
      }
      close();
    } catch (cause) {
      fail(cause);
    }
  });

  const askDelete = async () => {
    if (!restaurant) return;
    const confirmed = await confirm({
      title: t('content.deleteTitle'),
      message: t('content.deleteMessage', { name: restaurant.name }),
      confirmLabel: t('content.deleteConfirm'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(restaurant.id);
      close();
    } catch (cause) {
      fail(cause);
    }
  };

  const { control } = form;
  return (
    <EntitySheet
      icon="restaurant-outline"
      tint="orange"
      testID="restaurant-sheet"
      visible={visible}
      title={restaurant ? t('places.editRestaurant') : t('places.addRestaurant')}
      onClose={close}
      onSubmit={() => void submit()}
      isSubmitting={create.isPending || update.isPending}
      error={error}
      {...(restaurant ? { onDelete: () => void askDelete() } : {})}
    >
      {restaurant ? null : <PlaceSearch onPick={pick} testID="restaurant-search" />}
      <FormSection title={t('content.sec.basic')}>
        <FormTextField
          control={control}
          name="name"
          label={t('places.name')}
          testID="restaurant-name"
        />
        <FieldRow>
          <FormTextField control={control} name="cuisine" label={t('places.cuisine')} />
          <FormSelectField
            control={control}
            name="status"
            label={t('content.status')}
            title={t('content.status')}
            options={RESTAURANT_STATUSES.map((value) => ({
              value,
              label: t(`enums.restaurantStatus.${value}`),
            }))}
          />
        </FieldRow>
        <FormTextField control={control} name="address" label={t('content.address')} />
      </FormSection>
      <FormSection title={t('content.sec.booking')}>
        <FieldRow>
          <FormDateField
            control={control}
            name="reservationDate"
            label={t('places.reservationDate')}
          />
          <FormTimeField
            control={control}
            name="reservationTime"
            label={t('places.reservationTime')}
            hint={t('content.timeHint')}
          />
        </FieldRow>
        <FormTextField
          control={control}
          name="reservationCode"
          label={t('places.reservationCode')}
        />
      </FormSection>
      <FormSection title={t('content.sec.money')}>
        <FieldRow>
          <FormTextField
            control={control}
            name="dishes"
            label={t('places.dishes')}
            hint={t('places.dishesHint')}
          />
          <FormTextField
            control={control}
            name="cost"
            label={t('content.cost')}
            hint={t('content.costHint', { currency })}
            keyboardType="decimal-pad"
          />
        </FieldRow>
        <FormTextField control={control} name="notes" label={t('content.notes')} multiline />
      </FormSection>
    </EntitySheet>
  );
}
