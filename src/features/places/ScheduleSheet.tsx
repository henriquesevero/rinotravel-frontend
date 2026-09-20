import { useMemo } from 'react';

import type { ItineraryDay, Place } from '@/core/api';
import { eachDay, formatDayShort, joinOptionalZoned } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { useEntityForm } from '@/features/content/use-entity-form';
import { useEnsureDay, useScheduleFromPlace } from '@/features/itinerary/hooks';
import { FormSelectField, FormTimeField } from '@/shared/ui';

import { scheduleSchema, type ScheduleFormValues } from './schemas';

interface ScheduleSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  place: Place | undefined;
  days: ItineraryDay[];
  startDate: string;
  endDate: string;
  timezone: string;
}

/** Turns a wishlist place into an itinerary item; the server copies its details. */
export function ScheduleSheet({
  tripId,
  visible,
  onClose,
  place,
  days,
  startDate,
  endDate,
  timezone,
}: ScheduleSheetProps) {
  const { t } = useTranslation();
  const schedule = useScheduleFromPlace(tripId);
  const ensureDay = useEnsureDay(tripId, days);
  const defaults = useMemo<ScheduleFormValues>(
    () => ({ date: startDate, startTime: '' }),
    [startDate],
  );
  const { form, error, fail, close, clearError } = useEntityForm<ScheduleFormValues>({
    schema: scheduleSchema,
    defaults,
    fields: ['date', 'startTime'],
    aliases: { dayId: 'date', start: 'startTime' },
    onClose,
  });

  const options = useMemo(() => {
    const locale = currentLocale();
    return eachDay(startDate, endDate).map((date) => ({
      value: date,
      label: formatDayShort(date, locale),
    }));
  }, [startDate, endDate]);

  const submit = form.handleSubmit(async (values) => {
    if (!place) return;
    clearError();
    try {
      const dayId = await ensureDay.ensure(values.date);
      await schedule.mutateAsync({
        id: newId(),
        placeId: place.id,
        dayId,
        start: joinOptionalZoned(values.date, values.startTime, timezone),
      });
      close();
    } catch (cause) {
      fail(cause);
    }
  });

  return (
    <EntitySheet
      testID="schedule-sheet"
      visible={visible}
      title={t('places.scheduleTitle', { name: place?.name ?? '' })}
      submitLabel={t('places.schedule')}
      onClose={close}
      onSubmit={() => void submit()}
      isSubmitting={schedule.isPending || ensureDay.isPending}
      error={error}
    >
      <FormSelectField
        control={form.control}
        name="date"
        label={t('itinerary.fieldDay')}
        title={t('itinerary.pickDay')}
        options={options}
        testID="schedule-date"
      />
      <FormTimeField
        control={form.control}
        name="startTime"
        label={t('content.startTime')}
        hint={t('content.timeHint')}
        testID="schedule-time"
      />
    </EntitySheet>
  );
}
