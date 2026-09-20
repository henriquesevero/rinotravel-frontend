import { useRouter } from 'expo-router';

import { useTranslation } from '@/core/i18n';

import { TripForm } from '../components/TripForm';
import { useCreateTrip } from '../hooks';
import { defaultCurrency, defaultTimezone } from '../options';
import type { TripFormValues } from '../schemas';

const emptyTrip = (): TripFormValues => ({
  name: '',
  destination: '',
  startDate: '',
  endDate: '',
  timezone: defaultTimezone(),
  currency: defaultCurrency(),
});

export function NewTripScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createTrip = useCreateTrip();

  return (
    <TripForm
      title={t('trips.new')}
      subtitle={t('trips.form.newSubtitle')}
      backFallback="/"
      submitLabel={t('trips.form.create')}
      defaultValues={emptyTrip()}
      isSubmitting={createTrip.isPending}
      error={createTrip.error}
      onSubmit={(values) =>
        createTrip.mutate(values, {
          onSuccess: (trip) => router.replace({ pathname: '/trips/[id]', params: { id: trip.id } }),
        })
      }
    />
  );
}
