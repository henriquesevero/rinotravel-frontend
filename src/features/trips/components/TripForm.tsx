import { zodResolver } from '@hookform/resolvers/zod';
import type { Href } from 'expo-router';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { View, type TextInput } from 'react-native';

import { isApiError } from '@/core/api';
import { applyApiFieldErrors } from '@/core/forms/apply-api-errors';
import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { space } from '@/shared/theme';
import {
  Banner,
  Button,
  FormDateField,
  FormSelectField,
  FormTextField,
  Screen,
  ScreenHeader,
} from '@/shared/ui';

import { currencyOptions, timezoneOptions } from '../options';
import { TRIP_FORM_FIELDS, tripFormSchema, type TripFormValues } from '../schemas';

interface TripFormProps {
  title: string;
  backFallback: Href;
  submitLabel: string;
  defaultValues: TripFormValues;
  onSubmit: (values: TripFormValues) => void;
  isSubmitting: boolean;
  /** Error from the last submit; field errors land on the fields, the rest in a banner. */
  error?: unknown;
  /** Extra content above the form, e.g. the edit-conflict banner. */
  notice?: ReactNode;
}

export function TripForm({
  title,
  backFallback,
  submitLabel,
  defaultValues,
  onSubmit,
  isSubmitting,
  error,
  notice,
}: TripFormProps) {
  const { t } = useTranslation();
  const describe = useDescribeError();
  const destinationRef = useRef<TextInput>(null);
  const { control, handleSubmit, setError } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (error) applyApiFieldErrors(error, setError, TRIP_FORM_FIELDS);
  }, [error, setError]);

  const timezones = useMemo(
    () => timezoneOptions(defaultValues.timezone),
    [defaultValues.timezone],
  );
  const currencies = useMemo(
    () => currencyOptions((code) => t(`currencies.${code}`), defaultValues.currency),
    [defaultValues.currency, t],
  );

  const submit = handleSubmit(onSubmit);
  const hasFieldErrors = isApiError(error) && error.fieldErrors.length > 0;

  return (
    <Screen
      footer={<Button title={submitLabel} onPress={submit} loading={isSubmitting} fullWidth />}
    >
      <ScreenHeader title={title} backFallback={backFallback} />
      <View style={{ gap: space.lg }}>
        {notice}
        {error && !hasFieldErrors && !notice ? (
          <Banner tone="danger" message={describe(error)} />
        ) : null}
        <FormTextField
          control={control}
          name="name"
          label={t('trips.form.name')}
          placeholder={t('trips.form.namePlaceholder')}
          returnKeyType="next"
          onSubmitEditing={() => destinationRef.current?.focus()}
        />
        <FormTextField
          control={control}
          name="destination"
          label={t('trips.form.destination')}
          placeholder={t('trips.form.destinationPlaceholder')}
          inputRef={destinationRef}
          returnKeyType="done"
        />
        <FormDateField
          control={control}
          name="startDate"
          label={t('trips.form.startDate')}
          testID="trip-start-date"
        />
        <FormDateField
          control={control}
          name="endDate"
          label={t('trips.form.endDate')}
          testID="trip-end-date"
        />
        <FormSelectField
          control={control}
          name="timezone"
          label={t('trips.form.timezone')}
          title={t('trips.form.pickTimezone')}
          hint={t('trips.form.timezoneHint')}
          options={timezones}
          searchable
          testID="trip-timezone"
        />
        <FormSelectField
          control={control}
          name="currency"
          label={t('trips.form.currency')}
          title={t('trips.form.pickCurrency')}
          options={currencies}
          searchable
          testID="trip-currency"
        />
      </View>
    </Screen>
  );
}
