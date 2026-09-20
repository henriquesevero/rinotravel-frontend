import { useWatch } from 'react-hook-form';
import { useMemo, useState } from 'react';

import type { Location, Place, PlaceCandidate } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { LocationPreview } from '@/features/content/LocationPreview';
import { SplitForm, useWideForm } from '@/features/content/SplitForm';
import { useLocationPreview } from '@/features/content/use-location-preview';
import { PlaceSearch } from '@/features/content/PlaceSearch';
import {
  fromMoney,
  fromOptionalInt,
  mergeLocation,
  toMoneyInput,
  toOptionalInt,
} from '@/features/content/mappers';
import { useEntityForm } from '@/features/content/use-entity-form';
import { FormSelectField, FormTextField, useConfirm, FormSection, FieldRow } from '@/shared/ui';

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

  const watched_name = useWatch({ control: form.control, name: 'name' }) as string;
  const watched_address = useWatch({ control: form.control, name: 'address' }) as string;

  const wide = useWideForm();
  const preview = useLocationPreview({
    nameNow: watched_name,
    addressNow: watched_address,
    pick: picked,
    previous: place?.location,
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
      size="lg"
      icon="location-outline"
      tint="violet"
      testID="place-sheet"
      visible={visible}
      title={place ? t('places.editPlace') : t('places.addPlace')}
      onClose={close}
      onSubmit={() => void submit()}
      isSubmitting={create.isPending || update.isPending}
      error={error}
      {...(place ? { onDelete: () => void askDelete() } : {})}
    >
      <SplitForm
        wide={wide}
        side={
          <LocationPreview
            tripId={tripId}
            location={preview.location}
            exact={preview.exact}
            wide={wide}
          />
        }
      >
        {place ? null : <PlaceSearch onPick={pick} testID="place-search" />}
        <FormSection title={t('content.sec.basic')}>
          <FormTextField
            control={control}
            name="name"
            label={t('places.name')}
            testID="place-name"
          />
          <FieldRow>
            <FormSelectField
              control={control}
              name="category"
              label={t('content.category')}
              title={t('content.category')}
              options={PLACE_CATEGORIES.map((value) => ({
                value,
                label: t(`enums.category.${value}`),
              }))}
            />
            <FormSelectField
              control={control}
              name="priority"
              label={t('places.priority')}
              title={t('places.priority')}
              options={PRIORITIES.map((value) => ({ value, label: t(`enums.priority.${value}`) }))}
            />
          </FieldRow>
        </FormSection>
        <FormSection title={t('content.sec.where')}>
          <FormTextField control={control} name="address" label={t('content.address')} />
        </FormSection>
        <FormSection title={t('content.sec.money')}>
          <FieldRow>
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
          </FieldRow>
          <FormTextField control={control} name="notes" label={t('content.notes')} multiline />
        </FormSection>
      </SplitForm>
    </EntitySheet>
  );
}
