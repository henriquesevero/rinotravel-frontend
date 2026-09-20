import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View, useWindowDimensions, type TextInput } from 'react-native';

import { isApiError } from '@/core/api';
import { applyApiFieldErrors } from '@/core/forms/apply-api-errors';
import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { space, useStyles, type Theme } from '@/shared/theme';
import {
  Banner,
  Button,
  Card,
  FieldRow,
  FormDateField,
  FormSelectField,
  FormSection,
  FormTextField,
  Screen,
  ScreenHeader,
} from '@/shared/ui';

import { currencyOptions, timezoneOptions } from '../options';
import { TRIP_FORM_FIELDS, tripFormSchema, type TripFormValues } from '../schemas';

interface TripFormProps {
  title: string;
  subtitle?: string;
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

const WIDE_BREAKPOINT = 768;
const FORM_MAX_WIDTH = 760;

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    card: { width: '100%', maxWidth: FORM_MAX_WIDTH, padding: 0 },
    body: { padding: space.xl, gap: space.xl },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: space.md,
      paddingHorizontal: space.xl,
      paddingVertical: space.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.surfaceMuted,
    },
    stack: { gap: space.xl },
  });

export function TripForm({
  title,
  subtitle,
  backFallback,
  submitLabel,
  defaultValues,
  onSubmit,
  isSubmitting,
  error,
  notice,
}: TripFormProps) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const wide = useWindowDimensions().width >= WIDE_BREAKPOINT;
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

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(backFallback);
  };

  const feedback = (
    <>
      {notice}
      {error && !hasFieldErrors && !notice ? (
        <Banner tone="danger" message={describe(error)} />
      ) : null}
    </>
  );

  const fields = (
    <>
      <FormSection title={t('trips.form.secBasic')}>
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
      </FormSection>
      <FormSection title={t('trips.form.secDates')}>
        <FieldRow>
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
        </FieldRow>
      </FormSection>
      <FormSection title={t('trips.form.secRegion')}>
        <FieldRow>
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
        </FieldRow>
      </FormSection>
    </>
  );

  const header = (
    <ScreenHeader title={title} backFallback={backFallback} {...(subtitle ? { subtitle } : {})} />
  );

  // On computers the form is a card with its buttons at the foot; on phones the button rides the bottom edge.
  if (wide) {
    return (
      <Screen>
        {header}
        <Card padded={false} style={styles.card}>
          <View style={styles.body}>
            {feedback}
            {fields}
          </View>
          <View style={styles.actions}>
            <Button title={t('common.cancel')} variant="secondary" onPress={goBack} />
            <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      footer={<Button title={submitLabel} onPress={submit} loading={isSubmitting} fullWidth />}
    >
      {header}
      <View style={styles.stack}>
        {feedback}
        {fields}
      </View>
    </Screen>
  );
}
