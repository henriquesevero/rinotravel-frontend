import type { Place, Restaurant } from '@/core/api';
import { formatZoned } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { DetailSheet } from '@/features/content/DetailSheet';
import { moneyText } from '@/features/content/detail-helpers';
import { LinkedExpenses } from '@/features/expenses/LinkedExpenses';
import { CATEGORY_VISUAL } from '@/features/content/visuals';
import type { BadgeTone } from '@/shared/ui';

interface Common {
  tripId: string;
  currency: string;
  visible: boolean;
  onClose: () => void;
  onEdit?: (() => void) | undefined;
}

const PRIORITY_TONE: Record<Place['priority'], BadgeTone> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'neutral',
};

export function PlaceDetailSheet({ place, ...common }: Common & { place: Place | undefined }) {
  const { t } = useTranslation();
  const locale = currentLocale();
  const visual = CATEGORY_VISUAL[place?.category ?? 'OTHER'];
  return (
    <DetailSheet
      {...common}
      visible={common.visible && place !== undefined}
      title={place?.name ?? ''}
      icon={visual.icon}
      tint={visual.tint}
      badges={
        place
          ? [
              { label: t(`enums.category.${place.category}`) },
              {
                label: t(`enums.priority.${place.priority}`),
                tone: PRIORITY_TONE[place.priority],
              },
            ]
          : []
      }
      rows={[
        { label: t('detail.address'), value: place?.location?.address },
        {
          label: t('detail.duration'),
          value: place?.estimatedDurationMinutes
            ? `${place.estimatedDurationMinutes} ${t('content.minutes')}`
            : undefined,
        },
        {
          label: t('detail.cost'),
          value: moneyText(place?.estimatedCost, common.currency, locale),
        },
        { label: t('detail.description'), value: place?.description },
      ]}
      notes={place?.notes}
      location={place?.location}
      actions={
        place ? (
          <LinkedExpenses
            tripId={common.tripId}
            currency={common.currency}
            link={{ type: 'place', id: place.id }}
            canWrite={common.onEdit !== undefined}
            onNavigate={common.onClose}
          />
        ) : undefined
      }
      testID="place-detail"
    />
  );
}

const RESTAURANT_TONE: Record<Restaurant['status'], BadgeTone> = {
  WISHLIST: 'neutral',
  PLANNED: 'accent',
  RESERVED: 'success',
  VISITED: 'success',
};

export function RestaurantDetailSheet({
  restaurant,
  ...common
}: Common & { restaurant: Restaurant | undefined }) {
  const { t } = useTranslation();
  const locale = currentLocale();
  return (
    <DetailSheet
      {...common}
      visible={common.visible && restaurant !== undefined}
      title={restaurant?.name ?? ''}
      subtitle={restaurant?.cuisine}
      icon="restaurant-outline"
      tint="orange"
      badges={
        restaurant
          ? [
              {
                label: t(`enums.restaurantStatus.${restaurant.status}`),
                tone: RESTAURANT_TONE[restaurant.status],
              },
            ]
          : []
      }
      rows={[
        {
          label: t('detail.reservation'),
          value: restaurant?.reservationAt
            ? formatZoned(restaurant.reservationAt, locale)
            : undefined,
        },
        { label: t('detail.reservationCode'), value: restaurant?.reservationCode },
        { label: t('detail.address'), value: restaurant?.location?.address },
        {
          label: t('detail.dishes'),
          value: restaurant?.desiredDishes.length ? restaurant.desiredDishes.join(', ') : undefined,
        },
        {
          label: t('detail.cost'),
          value: moneyText(restaurant?.estimatedCost, common.currency, locale),
        },
      ]}
      notes={restaurant?.notes}
      location={restaurant?.location}
      actions={
        restaurant ? (
          <LinkedExpenses
            tripId={common.tripId}
            currency={common.currency}
            link={{ type: 'restaurant', id: restaurant.id }}
            canWrite={common.onEdit !== undefined}
            onNavigate={common.onClose}
          />
        ) : undefined
      }
      testID="restaurant-detail"
    />
  );
}
