import { useRouter } from 'expo-router';
import { useState } from 'react';

import { hasCode } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { Banner, ErrorState, Screen, ScreenHeader, Skeleton } from '@/shared/ui';

import { TripForm } from '../components/TripForm';
import { diffTrip, toFormValues } from '../diff';
import { useTrip, useUpdateTrip } from '../hooks';

export function EditTripScreen({ tripId }: { tripId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const trip = useTrip(tripId);
  const update = useUpdateTrip(tripId);
  // Bumped only when the user asks for the latest version, so a background refetch never wipes their edits.
  const [epoch, setEpoch] = useState(0);

  if (trip.isPending) {
    return (
      <Screen>
        <ScreenHeader title={t('trips.edit.title')} backFallback={`/trips/${tripId}`} />
        <Skeleton height={52} />
      </Screen>
    );
  }
  if (trip.isError) {
    return (
      <Screen>
        <ScreenHeader title={t('trips.edit.title')} backFallback={`/trips/${tripId}`} />
        <ErrorState
          error={trip.error}
          title={t('trips.detail.loadError')}
          onRetry={() => void trip.refetch()}
        />
      </Screen>
    );
  }

  const conflict = hasCode(update.error, 'version_conflict');

  return (
    <TripForm
      key={`${tripId}:${epoch}`}
      title={t('trips.edit.title')}
      backFallback={`/trips/${tripId}`}
      submitLabel={t('trips.form.save')}
      defaultValues={toFormValues(trip.data)}
      isSubmitting={update.isPending}
      error={update.error}
      notice={
        conflict ? (
          <Banner
            tone="warning"
            title={t('trips.edit.conflictTitle')}
            message={t('trips.edit.conflictMessage')}
            action={{
              label: t('trips.edit.reload'),
              onPress: () => {
                update.reset();
                setEpoch((value) => value + 1);
              },
            }}
          />
        ) : undefined
      }
      onSubmit={(values) => {
        const patch = diffTrip(trip.data, values);
        if (Object.keys(patch).length === 0) {
          router.back();
          return;
        }
        update.mutate(
          { baseVersion: trip.data.version, patch },
          { onSuccess: () => router.back() },
        );
      }}
    />
  );
}
