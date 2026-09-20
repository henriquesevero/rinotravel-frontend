import { useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useDebouncedValue } from '@/core/hooks/use-debounced-value';

import {
  hasCode,
  type Location,
  type PlaceCandidate,
  type RouteOption,
  type Transfer,
  type TransferLegInput,
} from '@/core/api';
import { formatDuration, joinOptionalZoned, splitZoned } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { PlaceInput } from '@/features/content/PlaceInput';
import {
  fromMoney,
  fromOptionalInt,
  locationFromField,
  mergeLocation,
  toMoneyInput,
  toOptionalInt,
} from '@/features/content/mappers';
import { useEntityForm } from '@/features/content/use-entity-form';
import { radius, space } from '@/shared/theme';
import {
  Banner,
  Button,
  Card,
  FormDateField,
  FormSelectField,
  FormTextField,
  FormTimeField,
  IconBadge,
  ListRow,
  Text,
  useConfirm,
  FormSection,
  FieldRow,
} from '@/shared/ui';

import { transferHooks, usePlanTransfer } from './hooks';
import { DIALOG_BREAKPOINT } from '@/shared/ui/Sheet';

import { RouteMap } from './RouteMap';
import {
  MODES,
  STATUSES,
  TRANSFER_ALIASES,
  TRANSFER_FIELDS,
  transferSchema,
  type TransferFormValues,
} from './schemas';

interface TransferSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  currency: string;
  timezone: string;
  defaultDate: string;
  transfer?: Transfer | undefined;
  /** Called with the saved transfer once the sheet has closed, e.g. to show its map. */
  onSaved?: (transfer: Transfer) => void;
}

export function TransferSheet({
  tripId,
  visible,
  onClose,
  currency,
  timezone,
  defaultDate,
  transfer,
  onSaved,
}: TransferSheetProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const wide = width >= DIALOG_BREAKPOINT;
  const describe = useDescribeError();
  const confirm = useConfirm();
  const create = transferHooks.useCreate(tripId);
  const update = transferHooks.useUpdate(tripId);
  const remove = transferHooks.useRemove(tripId);
  const plan = usePlanTransfer(tripId);
  const [routes, setRoutes] = useState<RouteOption[] | null>(null);
  const [chosen, setChosen] = useState<RouteOption | null>(null);
  const [originPick, setOriginPick] = useState<PlaceCandidate | null>(null);
  const [destinationPick, setDestinationPick] = useState<PlaceCandidate | null>(null);
  const [showMap, setShowMap] = useState(false);

  const singleLeg = transfer?.legs.length === 1 ? transfer.legs[0] : undefined;
  const editsLegs = transfer === undefined || singleLeg !== undefined;
  const schema = useMemo(() => transferSchema(currency), [currency]);
  const defaults = useMemo<TransferFormValues>(() => {
    const leg = singleLeg ?? transfer?.legs[0];
    const departure = splitZoned(leg?.departure);
    return {
      origin: transfer?.origin?.name ?? transfer?.origin?.address ?? '',
      destination: transfer?.destination?.name ?? transfer?.destination?.address ?? '',
      mode: leg?.mode ?? 'SUBWAY',
      status: transfer?.status ?? 'PLANNED',
      date: departure.date || defaultDate,
      departTime: departure.time,
      arriveTime: splitZoned(leg?.arrival).time,
      duration: fromOptionalInt(leg?.estimatedDurationMinutes),
      line: leg?.line ?? '',
      instructions: leg?.instructions ?? '',
      cost: fromMoney(leg?.cost),
      notes: transfer?.notes ?? '',
    };
  }, [transfer, singleLeg, defaultDate]);
  const { form, error, fail, close, clearError } = useEntityForm<TransferFormValues>({
    schema,
    defaults,
    fields: TRANSFER_FIELDS,
    aliases: TRANSFER_ALIASES,
    onClose: () => {
      setRoutes(null);
      setChosen(null);
      setOriginPick(null);
      setDestinationPick(null);
      setShowMap(false);
      plan.reset();
      onClose();
    },
  });

  // Free typing waits until it settles; a place picked from the suggestions is used at once, so
  // choosing one never triggers a map for the half-typed text it replaced.
  const originNow = form.watch('origin');
  const destinationNow = form.watch('destination');
  const originTyped = useDebouncedValue(originNow, 700);
  const destinationTyped = useDebouncedValue(destinationNow, 700);
  const originText = originPick && originNow === originPick.name ? originNow : originTyped;
  const destinationText =
    destinationPick && destinationNow === destinationPick.name ? destinationNow : destinationTyped;
  const modeValue = form.watch('mode');
  const previewOrigin =
    originText.trim().length >= 3
      ? locationFromField(originText, originPick, transfer?.origin)
      : null;
  const previewDestination =
    destinationText.trim().length >= 3
      ? locationFromField(destinationText, destinationPick, transfer?.destination)
      : null;
  const canPreview = previewOrigin !== null && previewDestination !== null;
  // Both ends picked from Google's suggestions is a sure thing: draw the map right away. Typed-in
  // text may still be half-written, so it waits for a tap and does not spend a lookup per keystroke.
  const showPreview = canPreview && ((originPick && destinationPick) || showMap);

  const searchRoutes = () => {
    const { origin, destination, mode, date, departTime } = form.getValues();
    if (origin.trim() === '' || destination.trim() === '') return;
    setChosen(null);
    plan.mutate(
      {
        origin: locationFromField(origin, originPick, null) ?? { name: origin.trim() },
        destination: locationFromField(destination, destinationPick, null) ?? {
          name: destination.trim(),
        },
        mode,
        ...(joinOptionalZoned(date, departTime, timezone)
          ? { departureAt: joinOptionalZoned(date, departTime, timezone)! }
          : {}),
        language: currentLocale(),
      },
      { onSuccess: setRoutes },
    );
  };

  const chooseRoute = (route: RouteOption) => {
    setChosen(route);
    form.setValue('duration', String(route.durationMinutes));
  };

  const legFromForm = (values: TransferFormValues): TransferLegInput => ({
    mode: values.mode,
    origin: locationFromField(values.origin, originPick, null) ?? { name: values.origin },
    destination: locationFromField(values.destination, destinationPick, null) ?? {
      name: values.destination,
    },
    ...(joinOptionalZoned(values.date, values.departTime, timezone)
      ? { departure: joinOptionalZoned(values.date, values.departTime, timezone)! }
      : {}),
    ...(joinOptionalZoned(values.date, values.arriveTime, timezone)
      ? { arrival: joinOptionalZoned(values.date, values.arriveTime, timezone)! }
      : {}),
    ...(toOptionalInt(values.duration) !== null
      ? { estimatedDurationMinutes: toOptionalInt(values.duration)! }
      : {}),
    ...(values.line ? { line: values.line } : {}),
    ...(values.instructions ? { instructions: values.instructions } : {}),
    ...(toMoneyInput(values.cost, currency) ? { cost: toMoneyInput(values.cost, currency)! } : {}),
  });

  const submit = form.handleSubmit(async (values) => {
    clearError();
    const routeOrigin: Location | undefined = chosen?.transfer.origin;
    const routeDestination: Location | undefined = chosen?.transfer.destination;
    const base = {
      origin: locationFromField(values.origin, originPick, routeOrigin ?? transfer?.origin),
      destination: locationFromField(
        values.destination,
        destinationPick,
        routeDestination ?? transfer?.destination,
      ),
      status: values.status,
      notes: values.notes,
      ...(chosen
        ? {
            routeProvider: chosen.transfer.routeProvider,
            ...(chosen.transfer.externalRouteId
              ? { externalRouteId: chosen.transfer.externalRouteId }
              : {}),
          }
        : {}),
    };
    const legs = chosen ? chosen.transfer.legs : editsLegs ? [legFromForm(values)] : undefined;
    try {
      const saved = transfer
        ? await update.mutateAsync({
            id: transfer.id,
            baseVersion: transfer.version,
            patch: { ...base, ...(legs ? { legs } : {}) },
          })
        : await create.mutateAsync({ id: newId(), ...base, legs: legs ?? [] });
      close();
      onSaved?.(saved);
    } catch (cause) {
      fail(cause);
    }
  });

  const askDelete = async () => {
    if (!transfer) return;
    const confirmed = await confirm({
      title: t('content.deleteTitle'),
      message: t('content.deleteMessage', {
        name: `${transfer.origin?.name ?? ''} → ${transfer.destination?.name ?? ''}`,
      }),
      confirmLabel: t('content.deleteConfirm'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(transfer.id);
      close();
    } catch (cause) {
      fail(cause);
    }
  };

  const { control } = form;
  const planUnavailable = plan.isError && hasCode(plan.error, 'route_not_found');
  const km = (meters: number) => (meters / 1000).toFixed(1);

  const mapBlock =
    showPreview && previewOrigin && previewDestination ? (
      <RouteMap
        tripId={tripId}
        origin={previewOrigin}
        destination={previewDestination}
        mode={modeValue}
        originLabel={previewOrigin.name ?? ''}
        destinationLabel={previewDestination.name ?? ''}
        modes={[modeValue]}
      />
    ) : canPreview ? (
      <Button
        testID="show-map"
        title={t('transfers.showMap')}
        variant="secondary"
        icon="map-outline"
        onPress={() => setShowMap(true)}
      />
    ) : wide ? (
      <View style={styles.placeholder} testID="map-placeholder">
        <IconBadge icon="map-outline" tint="blue" size={48} round />
        <Text variant="subhead" tone="secondary" align="center">
          {t('transfers.mapPlaceholder')}
        </Text>
      </View>
    ) : null;

  return (
    <EntitySheet
      icon="swap-horizontal-outline"
      tint="green"
      testID="transfer-sheet"
      size="lg"
      visible={visible}
      title={transfer ? t('transfers.edit') : t('transfers.add')}
      onClose={close}
      onSubmit={() => void submit()}
      isSubmitting={create.isPending || update.isPending}
      error={error}
      {...(transfer ? { onDelete: () => void askDelete() } : {})}
    >
      <View style={wide ? styles.split : styles.stack}>
        <View style={wide ? styles.left : styles.stack}>
          <FormSection title={t('content.sec.route')}>
            <PlaceInput
              control={control}
              name="origin"
              label={t('transfers.origin')}
              pick={originPick}
              onPick={setOriginPick}
              testID="transfer-origin"
            />
            <PlaceInput
              control={control}
              name="destination"
              label={t('transfers.destination')}
              pick={destinationPick}
              onPick={setDestinationPick}
              testID="transfer-destination"
            />
            <FormSelectField
              control={control}
              name="mode"
              label={t('transfers.mode')}
              title={t('transfers.mode')}
              options={MODES.map((value) => ({ value, label: t(`enums.mode.${value}`) }))}
              testID="transfer-mode"
            />
            {wide ? null : mapBlock}
            {transfer ? null : (
              <View style={{ gap: space.sm }}>
                <Button
                  testID="suggest-routes"
                  title={t('transfers.suggest')}
                  variant="secondary"
                  icon="navigate-outline"
                  loading={plan.isPending}
                  onPress={searchRoutes}
                  fullWidth
                />
                {plan.isError ? (
                  <Banner
                    tone="warning"
                    message={
                      planUnavailable ? t('transfers.suggestUnavailable') : describe(plan.error)
                    }
                  />
                ) : null}
                {routes && routes.length > 0 ? (
                  <View style={{ gap: space.sm }}>
                    <Text variant="subhead" tone="secondary">
                      {t('transfers.suggestions')}
                    </Text>
                    <Card padded={false}>
                      {routes.map((route, index) => (
                        <ListRow
                          key={`${route.transfer.externalRouteId ?? index}`}
                          testID={`route-${index}`}
                          divider={index > 0}
                          icon={chosen === route ? 'checkmark-circle' : 'navigate-outline'}
                          title={`${formatDuration(route.durationMinutes)} · ${t('transfers.km', { value: km(route.distanceMeters) })}`}
                          subtitle={t(
                            route.transfer.legs.length === 1
                              ? 'transfers.steps.one'
                              : 'transfers.steps.other',
                            {
                              count: route.transfer.legs.length,
                            },
                          )}
                          onPress={() => chooseRoute(route)}
                        />
                      ))}
                    </Card>
                  </View>
                ) : null}
                {chosen ? <Banner tone="info" message={t('transfers.routeUsed')} /> : null}
              </View>
            )}
          </FormSection>
          <FormSection title={t('content.sec.when')}>
            <FieldRow>
              <FormDateField control={control} name="date" label={t('transfers.date')} />
              <FormTimeField
                control={control}
                name="departTime"
                label={t('transfers.departTime')}
                hint={t('content.timeHint')}
              />
              <FormTimeField
                control={control}
                name="arriveTime"
                label={t('transfers.arriveTime')}
              />
            </FieldRow>
          </FormSection>
          <FormSection title={t('content.sec.money')}>
            <FieldRow>
              <FormTextField
                control={control}
                name="duration"
                label={t('transfers.duration')}
                keyboardType="number-pad"
              />
              <FormTextField control={control} name="line" label={t('transfers.line')} />
            </FieldRow>
            <FormTextField
              control={control}
              name="instructions"
              label={t('transfers.instructions')}
              multiline
            />
            <FieldRow>
              <FormTextField
                control={control}
                name="cost"
                label={t('content.cost')}
                hint={t('content.costHint', { currency })}
                keyboardType="decimal-pad"
              />
              <FormSelectField
                control={control}
                name="status"
                label={t('content.status')}
                title={t('content.status')}
                options={STATUSES.map((value) => ({ value, label: t(`enums.status.${value}`) }))}
              />
            </FieldRow>
            <FormTextField control={control} name="notes" label={t('content.notes')} multiline />
          </FormSection>
        </View>
        {wide ? <View style={styles.right}>{mapBlock}</View> : null}
      </View>
    </EntitySheet>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.xl },
  split: { flexDirection: 'row', gap: space.xl, alignItems: 'flex-start' },
  left: { flex: 1, minWidth: 0, gap: space.xl },
  // On computers the map stays in view beside the form while it is filled in.
  right: {
    flex: 1,
    minWidth: 0,
    ...({ position: 'sticky', top: 0 } as object),
  },
  placeholder: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(37, 99, 235, 0.35)',
  },
});
