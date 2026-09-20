import { useMemo } from 'react';

import type { ItineraryDay, ItineraryItem } from '@/core/api';
import { currentLocale, useTranslation } from '@/core/i18n';
import { formatDayShort, joinOptionalZoned, splitZoned } from '@/core/datetime/zoned';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { fromMoney, mergeLocation, toMoneyInput } from '@/features/content/mappers';
import { useEntityForm } from '@/features/content/use-entity-form';
import { FormSelectField, FormTextField, FormTimeField, useConfirm } from '@/shared/ui';

import { itemHooks, useEnsureDay } from './hooks';
import { ITEM_ALIASES, ITEM_FIELDS, itemSchema, type ItemFormValues } from './schemas';

interface ItemSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  /** Every date offered in the day picker, in order. */
  dates: string[];
  days: ItineraryDay[];
  timezone: string;
  currency: string;
  /** Editing when set; creating otherwise. */
  item?: ItineraryItem | undefined;
  defaultDate: string;
}

export function ItemSheet({
  tripId,
  visible,
  onClose,
  dates,
  days,
  timezone,
  currency,
  item,
  defaultDate,
}: ItemSheetProps) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const ensureDay = useEnsureDay(tripId, days);
  const createItem = itemHooks.useCreate(tripId);
  const updateItem = itemHooks.useUpdate(tripId);
  const removeItem = itemHooks.useRemove(tripId);

  const schema = useMemo(() => itemSchema(currency), [currency]);
  const dayDate = item ? days.find((day) => day.id === item.dayId)?.date : undefined;
  const defaults = useMemo<ItemFormValues>(
    () => ({
      title: item?.title ?? '',
      date: dayDate ?? defaultDate,
      startTime: splitZoned(item?.start).time,
      endTime: splitZoned(item?.end).time,
      category: item?.category ?? 'ATTRACTION',
      status: item?.status ?? 'PLANNED',
      locationName: item?.location?.name ?? '',
      address: item?.location?.address ?? '',
      cost: fromMoney(item?.estimatedCost),
      notes: item?.notes ?? '',
    }),
    [item, dayDate, defaultDate],
  );
  const { form, error, fail, close, clearError } = useEntityForm<ItemFormValues>({
    schema,
    defaults,
    fields: ITEM_FIELDS,
    aliases: ITEM_ALIASES,
    onClose,
  });

  const dateOptions = useMemo(() => {
    const locale = currentLocale();
    const all = dayDate && !dates.includes(dayDate) ? [dayDate, ...dates] : dates;
    return all.map((date) => ({
      value: date,
      label: formatDayShort(date, locale),
      ...(dates.includes(date) ? {} : { description: t('itinerary.outsideTrip') }),
    }));
  }, [dates, dayDate, t]);

  const submit = form.handleSubmit(async (values) => {
    clearError();
    try {
      const dayId = await ensureDay.ensure(values.date);
      const body = {
        dayId,
        title: values.title,
        category: values.category,
        status: values.status,
        notes: values.notes,
        start: joinOptionalZoned(values.date, values.startTime, timezone),
        end: joinOptionalZoned(values.date, values.endTime, timezone),
        estimatedCost: toMoneyInput(values.cost, currency),
      };
      if (item) {
        await updateItem.mutateAsync({
          id: item.id,
          baseVersion: item.version,
          patch: {
            ...body,
            location: mergeLocation(values.locationName, values.address, item.location),
          },
        });
      } else {
        await createItem.mutateAsync({
          id: newId(),
          ...body,
          location: mergeLocation(values.locationName, values.address, undefined),
        });
      }
      close();
    } catch (cause) {
      fail(cause);
    }
  });

  const remove = async () => {
    if (!item) return;
    const confirmed = await confirm({
      title: t('content.deleteTitle'),
      message: t('content.deleteMessage', { name: item.title }),
      confirmLabel: t('content.deleteConfirm'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await removeItem.mutateAsync(item.id);
      close();
    } catch (cause) {
      fail(cause);
    }
  };

  const { control } = form;
  return (
    <EntitySheet
      testID="item-sheet"
      visible={visible}
      title={item ? t('itinerary.editTitle') : t('itinerary.itemTitle')}
      onClose={close}
      onSubmit={() => void submit()}
      isSubmitting={createItem.isPending || updateItem.isPending || ensureDay.isPending}
      error={error}
      {...(item ? { onDelete: () => void remove() } : {})}
    >
      <FormTextField
        control={control}
        name="title"
        label={t('itinerary.fieldTitle')}
        placeholder={t('itinerary.fieldTitlePlaceholder')}
        testID="item-title"
      />
      <FormSelectField
        control={control}
        name="date"
        label={t('itinerary.fieldDay')}
        title={t('itinerary.pickDay')}
        options={dateOptions}
        testID="item-date"
      />
      <FormTimeField
        control={control}
        name="startTime"
        label={t('content.startTime')}
        hint={t('content.timeHint')}
        testID="item-start"
      />
      <FormTimeField
        control={control}
        name="endTime"
        label={t('content.endTime')}
        testID="item-end"
      />
      <FormSelectField
        control={control}
        name="category"
        label={t('content.category')}
        title={t('content.category')}
        options={(['ATTRACTION', 'RESTAURANT', 'SHOPPING', 'FREE_TIME', 'OTHER'] as const).map(
          (value) => ({
            value,
            label: t(`enums.category.${value}`),
          }),
        )}
        testID="item-category"
      />
      <FormSelectField
        control={control}
        name="status"
        label={t('content.status')}
        title={t('content.status')}
        options={(['PLANNED', 'CONFIRMED', 'COMPLETED', 'SKIPPED'] as const).map((value) => ({
          value,
          label: t(`enums.status.${value}`),
        }))}
        testID="item-status"
      />
      <FormTextField control={control} name="locationName" label={t('content.location')} />
      <FormTextField control={control} name="address" label={t('content.address')} />
      <FormTextField
        control={control}
        name="cost"
        label={t('content.cost')}
        hint={t('content.costHint', { currency })}
        keyboardType="decimal-pad"
      />
      <FormTextField control={control} name="notes" label={t('content.notes')} multiline />
    </EntitySheet>
  );
}
