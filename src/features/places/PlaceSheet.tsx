import { useMemo, useState } from 'react';

import type { Location, Place, PlaceCandidate } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { PlaceSearch } from '@/features/content/PlaceSearch';
import {
  fromMoney,
  fromOptionalInt,
  mergeLocation,
  toMoneyInput,
  toOptionalInt,
} from '@/features/content/mappers';
import { useEntityForm } from '@/features/content/use-entity-form';
import { FormSelectField, FormTextField, useConfirm } from '@/shared/ui';

import { placeHooks } from './hooks';
import {
  PLACE_ALIASES,
  PLACE_CATEGORIES,
  PLACE_FIELDS,
  PRIORITIES,
  placeSchema,
  type PlaceFormValues,
} from './schemas';

interface PlaceSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  currency: string;
  place?: Place | undefined;
}

function candidateLocation(candidate: PlaceCandidate): Location {
  return {
    name: candidate.name,
    ...(candidate.address ? { address: candidate.address } : {}),
    ...(candidate.latitude !== undefined ? { latitude: candidate.latitude } : {}),
    ...(candidate.longitude !== undefined ? { longitude: candidate.longitude } : {}),
  };
}

export function PlaceSheet({ tripId, visible, onClose, currency, place }: PlaceSheetProps) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const create = placeHooks.useCreate(tripId);
  const update = placeHooks.useUpdate(tripId);
  const remove = placeHooks.useRemove(tripId);
  const [picked, setPicked] = useState<PlaceCandidate | null>(null);

  const schema = useMemo(() => placeSchema(currency), [currency]);
  const defaults = useMemo<PlaceFormValues>(
    () => ({
      name: place?.name ?? '',
      category: place?.category ?? 'ATTRACTION',
      priority: place?.priority ?? 'MEDIUM',
      address: place?.location?.address ?? '',
      duration: fromOptionalInt(place?.estimatedDurationMinutes),
      cost: fromMoney(place?.estimatedCost),
      notes: place?.notes ?? '',
    }),
    [place],
  );
  const { form, error, fail, close, clearError } = useEntityForm<PlaceFormValues>({
    schema,
    defaults,
    fields: PLACE_FIELDS,
    aliases: PLACE_ALIASES,
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
    const base = picked ? candidateLocation(picked) : place?.location;
    const body = {
      name: values.name,
      category: values.category,
      priority: values.priority,
      notes: values.notes,
      location: mergeLocation(values.name, values.address, base),
      estimatedDurationMinutes: toOptionalInt(values.duration),
      estimatedCost: toMoneyInput(values.cost, currency),
      ...(picked ? { externalId: picked.providerId } : {}),
    };
    try {
      if (place) {
        await update.mutateAsync({ id: place.id, baseVersion: place.version, patch: body });
      } else {
        await create.mutateAsync({ id: newId(), ...body });
      }
      close();
    } catch (cause) {
      fail(cause);
    }
  });

  const askDelete = async () => {
    if (!place) return;
    const confirmed = await confirm({
      title: t('content.deleteTitle'),
      message: t('content.deleteMessage', { name: place.name }),
      confirmLabel: t('content.deleteConfirm'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(place.id);
      close();
    } catch (cause) {
      fail(cause);
    }
  };

  const { control } = form;
  return (
    <EntitySheet
      testID="place-sheet"
      visible={visible}
      title={place ? t('places.editPlace') : t('places.addPlace')}
      onClose={close}
      onSubmit={() => void submit()}
      isSubmitting={create.isPending || update.isPending}
      error={error}
      {...(place ? { onDelete: () => void askDelete() } : {})}
    >
      {place ? null : <PlaceSearch onPick={pick} testID="place-search" />}
      <FormTextField control={control} name="name" label={t('places.name')} testID="place-name" />
      <FormSelectField
        control={control}
        name="category"
        label={t('content.category')}
        title={t('content.category')}
        options={PLACE_CATEGORIES.map((value) => ({ value, label: t(`enums.category.${value}`) }))}
      />
      <FormSelectField
        control={control}
        name="priority"
        label={t('places.priority')}
        title={t('places.priority')}
        options={PRIORITIES.map((value) => ({ value, label: t(`enums.priority.${value}`) }))}
      />
      <FormTextField control={control} name="address" label={t('content.address')} />
      <FormTextField
        control={control}
        name="duration"
        label={t('places.duration')}
        keyboardType="number-pad"
      />
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
