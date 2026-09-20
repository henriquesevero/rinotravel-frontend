import { useState } from 'react';
import { View } from 'react-native';

import type { Flight, Hotel } from '@/core/api';
import {
  daysBetween,
  formatDuration,
  formatZoned,
  zonedDate,
  zonedKey,
} from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { defaultTimezone } from '@/features/trips/options';
import { TripPage } from '@/features/content/TripPage';
import { space } from '@/shared/theme';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  SegmentedControl,
  Skeleton,
} from '@/shared/ui';

import { FlightSheet } from './FlightSheet';
import { HotelSheet } from './HotelSheet';
import { flightHooks, hotelHooks } from './hooks';

type Tab = 'flights' | 'hotels';

export function BookingsScreen({ tripId }: { tripId: string }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('flights');
  const flights = flightHooks.useList(tripId);
  const hotels = hotelHooks.useList(tripId);
  const [flightSheet, setFlightSheet] = useState<{ flight?: Flight | undefined } | null>(null);
  const [hotelSheet, setHotelSheet] = useState<{ hotel?: Hotel | undefined } | null>(null);

  const add = () => (tab === 'flights' ? setFlightSheet({}) : setHotelSheet({}));

  return (
    <TripPage
      tripId={tripId}
      title={t('bookings.title')}
      onRefresh={() => {
        void flights.refetch();
        void hotels.refetch();
      }}
      right={({ canWrite }) =>
        canWrite ? (
          <Button
            testID="add-booking"
            title={tab === 'flights' ? t('bookings.addFlight') : t('bookings.addHotel')}
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
            testID="bookings-tabs"
            value={tab}
            onChange={setTab}
            segments={[
              { value: 'flights', label: t('bookings.tabFlights') },
              { value: 'hotels', label: t('bookings.tabHotels') },
            ]}
          />
          {tab === 'flights' ? (
            <FlightList
              query={flights}
              canWrite={canWrite}
              onAdd={() => setFlightSheet({})}
              onEdit={(flight) => setFlightSheet({ flight })}
            />
          ) : (
            <HotelList
              query={hotels}
              canWrite={canWrite}
              onAdd={() => setHotelSheet({})}
              onEdit={(hotel) => setHotelSheet({ hotel })}
            />
          )}
          <FlightSheet
            tripId={tripId}
            visible={flightSheet !== null}
            onClose={() => setFlightSheet(null)}
            tripTimezone={trip.timezone}
            homeTimezone={defaultTimezone()}
            flight={flightSheet?.flight}
          />
          <HotelSheet
            tripId={tripId}
            visible={hotelSheet !== null}
            onClose={() => setHotelSheet(null)}
            timezone={trip.timezone}
            hotel={hotelSheet?.hotel}
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
      <Skeleton height={72} borderRadius={16} />
      <Skeleton height={72} borderRadius={16} />
    </View>
  );
}

function FlightList({
  query,
  canWrite,
  onAdd,
  onEdit,
}: {
  query: ListQuery<Flight>;
  canWrite: boolean;
  onAdd: () => void;
  onEdit: (flight: Flight) => void;
}) {
  const { t } = useTranslation();
  if (query.error) {
    return (
      <ErrorState
        error={query.error}
        title={t('bookings.loadError')}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (!query.data) return <ListSkeleton />;
  if (query.data.length === 0) {
    return (
      <EmptyState
        icon="airplane-outline"
        title={t('bookings.emptyFlightsTitle')}
        message={t('bookings.emptyFlightsMessage')}
        {...(canWrite ? { actionLabel: t('bookings.addFlight'), onAction: onAdd } : {})}
      />
    );
  }
  const locale = currentLocale();
  const sorted = [...query.data].sort((a, b) =>
    zonedKey(a.departure).localeCompare(zonedKey(b.departure)),
  );
  return (
    <Card padded={false}>
      {sorted.map((flight, index) => (
        <ListRow
          key={flight.id}
          testID={`flight-${flight.id}`}
          divider={index > 0}
          icon="airplane-outline"
          title={`${flight.departureAirport} → ${flight.arrivalAirport} · ${flight.flightNumber}`}
          subtitle={`${formatZoned(flight.departure, locale)} → ${formatZoned(flight.arrival, locale)} · ${formatDuration(flight.durationMinutes)}`}
          right={
            flight.bookingCode ? <Badge label={flight.bookingCode} tone="accent" /> : undefined
          }
          {...(canWrite ? { onPress: () => onEdit(flight) } : {})}
        />
      ))}
    </Card>
  );
}

function HotelList({
  query,
  canWrite,
  onAdd,
  onEdit,
}: {
  query: ListQuery<Hotel>;
  canWrite: boolean;
  onAdd: () => void;
  onEdit: (hotel: Hotel) => void;
}) {
  const { t } = useTranslation();
  if (query.error) {
    return (
      <ErrorState
        error={query.error}
        title={t('bookings.loadError')}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (!query.data) return <ListSkeleton />;
  if (query.data.length === 0) {
    return (
      <EmptyState
        icon="bed-outline"
        title={t('bookings.emptyHotelsTitle')}
        message={t('bookings.emptyHotelsMessage')}
        {...(canWrite ? { actionLabel: t('bookings.addHotel'), onAction: onAdd } : {})}
      />
    );
  }
  const locale = currentLocale();
  const sorted = [...query.data].sort((a, b) =>
    zonedKey(a.checkIn).localeCompare(zonedKey(b.checkIn)),
  );
  return (
    <Card padded={false}>
      {sorted.map((hotel, index) => {
        const nights = daysBetween(zonedDate(hotel.checkIn), zonedDate(hotel.checkOut));
        return (
          <ListRow
            key={hotel.id}
            testID={`hotel-${hotel.id}`}
            divider={index > 0}
            icon="bed-outline"
            title={hotel.name}
            subtitle={`${formatZoned(hotel.checkIn, locale)} → ${formatZoned(hotel.checkOut, locale)} · ${t(nights === 1 ? 'bookings.nights.one' : 'bookings.nights.other', { count: nights })}`}
            right={
              hotel.confirmationCode ? (
                <Badge label={hotel.confirmationCode} tone="accent" />
              ) : undefined
            }
            {...(canWrite ? { onPress: () => onEdit(hotel) } : {})}
          />
        );
      })}
    </Card>
  );
}
