import { useState } from 'react';
import { View } from 'react-native';

import type { Place, Restaurant, Trip } from '@/core/api';
import { formatMoney } from '@/core/datetime/money';
import { formatZoned } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { TripPage } from '@/features/content/TripPage';
import { dayHooks } from '@/features/itinerary/hooks';
import { space } from '@/shared/theme';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  ListRow,
  SegmentedControl,
  Skeleton,
  type BadgeTone,
} from '@/shared/ui';

import { PlaceSheet } from './PlaceSheet';
import { RestaurantSheet } from './RestaurantSheet';
import { ScheduleSheet } from './ScheduleSheet';
import { placeHooks, restaurantHooks } from './hooks';

type Tab = 'places' | 'restaurants';

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
const PRIORITY_TONE: Record<Place['priority'], BadgeTone> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'neutral',
};
const RESTAURANT_TONE: Record<Restaurant['status'], BadgeTone> = {
  WISHLIST: 'neutral',
  PLANNED: 'accent',
  RESERVED: 'success',
  VISITED: 'success',
};

export function PlacesScreen({ tripId }: { tripId: string }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('places');
  const places = placeHooks.useList(tripId);
  const restaurants = restaurantHooks.useList(tripId);
  const days = dayHooks.useList(tripId);

  const [placeSheet, setPlaceSheet] = useState<{ place?: Place | undefined } | null>(null);
  const [restaurantSheet, setRestaurantSheet] = useState<{
    restaurant?: Restaurant | undefined;
  } | null>(null);
  const [scheduling, setScheduling] = useState<Place | undefined>(undefined);

  const add = () => (tab === 'places' ? setPlaceSheet({}) : setRestaurantSheet({}));
  const refresh = () => {
    void places.refetch();
    void restaurants.refetch();
  };

  return (
    <TripPage
      tripId={tripId}
      title={t('places.title')}
      onRefresh={refresh}
      right={({ canWrite }) =>
        canWrite ? (
          <Button
            testID="add-place"
            title={tab === 'places' ? t('places.addPlace') : t('places.addRestaurant')}
            icon="add"
            size="sm"
            onPress={add}
          />
        ) : null
      }
    >
      {({ trip, canWrite }) => (
        <>
          <SegmentedControl
            testID="places-tabs"
            value={tab}
            onChange={setTab}
            segments={[
              { value: 'places', label: t('places.tabPlaces') },
              { value: 'restaurants', label: t('places.tabRestaurants') },
            ]}
          />
          {tab === 'places' ? (
            <PlaceList
              query={places}
              canWrite={canWrite}
              currency={trip.currency}
              onAdd={() => setPlaceSheet({})}
              onEdit={(place) => setPlaceSheet({ place })}
              onSchedule={setScheduling}
            />
          ) : (
            <RestaurantList
              query={restaurants}
              trip={trip}
              canWrite={canWrite}
              onAdd={() => setRestaurantSheet({})}
              onEdit={(restaurant) => setRestaurantSheet({ restaurant })}
            />
          )}

          <PlaceSheet
            tripId={tripId}
            visible={placeSheet !== null}
            onClose={() => setPlaceSheet(null)}
            currency={trip.currency}
            place={placeSheet?.place}
          />
          <RestaurantSheet
            tripId={tripId}
            visible={restaurantSheet !== null}
            onClose={() => setRestaurantSheet(null)}
            currency={trip.currency}
            timezone={trip.timezone}
            restaurant={restaurantSheet?.restaurant}
          />
          <ScheduleSheet
            tripId={tripId}
            visible={scheduling !== undefined}
            onClose={() => setScheduling(undefined)}
            place={scheduling}
            days={days.data ?? []}
            startDate={trip.startDate}
            endDate={trip.endDate}
            timezone={trip.timezone}
          />
        </>
      )}
    </TripPage>
  );
}

interface ListQuery<T> {
  data: T[] | undefined;
  error: unknown;
  refetch: () => unknown;
}

function ListSkeleton() {
  return (
    <View style={{ gap: space.sm }}>
      <Skeleton height={64} borderRadius={16} />
      <Skeleton height={64} borderRadius={16} />
    </View>
  );
}

function PlaceList({
  query,
  canWrite,
  currency,
  onAdd,
  onEdit,
  onSchedule,
}: {
  query: ListQuery<Place>;
  canWrite: boolean;
  currency: string;
  onAdd: () => void;
  onEdit: (place: Place) => void;
  onSchedule: (place: Place) => void;
}) {
  const { t } = useTranslation();
  if (query.error) {
    return (
      <ErrorState
        error={query.error}
        title={t('places.loadError')}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (!query.data) return <ListSkeleton />;
  if (query.data.length === 0) {
    return (
      <EmptyState
        icon="location-outline"
        title={t('places.emptyPlacesTitle')}
        message={t('places.emptyPlacesMessage')}
        {...(canWrite ? { actionLabel: t('places.addPlace'), onAction: onAdd } : {})}
      />
    );
  }
  const sorted = [...query.data].sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.name.localeCompare(b.name),
  );
  const locale = currentLocale();
  return (
    <Card padded={false}>
      {sorted.map((place, index) => {
        const parts = [
          t(`enums.category.${place.category}`),
          place.estimatedCost &&
            formatMoney(
              place.estimatedCost.amount,
              place.estimatedCost.currency || currency,
              locale,
            ),
          place.location?.address,
        ].filter(Boolean);
        return (
          <ListRow
            key={place.id}
            testID={`place-${place.id}`}
            divider={index > 0}
            icon="location-outline"
            title={place.name}
            subtitle={parts.join(' · ')}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                <Badge
                  label={t(`enums.priority.${place.priority}`)}
                  tone={PRIORITY_TONE[place.priority]}
                />
                {canWrite ? (
                  <IconButton
                    icon="calendar-outline"
                    label={t('places.schedule')}
                    onPress={() => onSchedule(place)}
                    testID={`schedule-${place.id}`}
                  />
                ) : null}
              </View>
            }
            {...(canWrite ? { onPress: () => onEdit(place) } : {})}
          />
        );
      })}
    </Card>
  );
}

function RestaurantList({
  query,
  trip,
  canWrite,
  onAdd,
  onEdit,
}: {
  query: ListQuery<Restaurant>;
  trip: Trip;
  canWrite: boolean;
  onAdd: () => void;
  onEdit: (restaurant: Restaurant) => void;
}) {
  const { t } = useTranslation();
  if (query.error) {
    return (
      <ErrorState
        error={query.error}
        title={t('places.loadError')}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (!query.data) return <ListSkeleton />;
  if (query.data.length === 0) {
    return (
      <EmptyState
        icon="restaurant-outline"
        title={t('places.emptyRestaurantsTitle')}
        message={t('places.emptyRestaurantsMessage')}
        {...(canWrite ? { actionLabel: t('places.addRestaurant'), onAction: onAdd } : {})}
      />
    );
  }
  const locale = currentLocale();
  return (
    <Card padded={false}>
      {query.data.map((restaurant, index) => {
        const parts = [
          restaurant.cuisine,
          restaurant.reservationAt && formatZoned(restaurant.reservationAt, locale),
          restaurant.estimatedCost &&
            formatMoney(
              restaurant.estimatedCost.amount,
              restaurant.estimatedCost.currency || trip.currency,
              locale,
            ),
        ].filter(Boolean);
        return (
          <ListRow
            key={restaurant.id}
            testID={`restaurant-${restaurant.id}`}
            divider={index > 0}
            icon="restaurant-outline"
            title={restaurant.name}
            subtitle={parts.join(' · ')}
            right={
              <Badge
                label={t(`enums.restaurantStatus.${restaurant.status}`)}
                tone={RESTAURANT_TONE[restaurant.status]}
              />
            }
            {...(canWrite ? { onPress: () => onEdit(restaurant) } : {})}
          />
        );
      })}
    </Card>
  );
}
