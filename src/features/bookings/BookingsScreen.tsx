import { useState } from 'react';
import { View } from 'react-native';

import type { Flight, Hotel, Ticket } from '@/core/api';
import {
  daysBetween,
  formatDuration,
  formatZoned,
  zonedDate,
  zonedKey,
  zonedTime,
} from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { defaultTimezone } from '@/features/trips/options';
import { TripPage } from '@/features/content/TripPage';
import { TICKET_VISUAL } from '@/features/content/visuals';
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

import { FlightDetailSheet, HotelDetailSheet, TicketDetailSheet } from './BookingDetailSheets';
import { FlightSheet } from './FlightSheet';
import { HotelSheet } from './HotelSheet';
import { flightHooks, hotelHooks, ticketHooks } from './hooks';
import { TicketSheet } from './TicketSheet';

type Tab = 'flights' | 'hotels' | 'tickets';

export function BookingsScreen({ tripId }: { tripId: string }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('flights');
  const flights = flightHooks.useList(tripId);
  const hotels = hotelHooks.useList(tripId);
  const tickets = ticketHooks.useList(tripId);
  const [flightSheet, setFlightSheet] = useState<{ flight?: Flight | undefined } | null>(null);
  const [hotelSheet, setHotelSheet] = useState<{ hotel?: Hotel | undefined } | null>(null);
  const [ticketSheet, setTicketSheet] = useState<{ ticket?: Ticket | undefined } | null>(null);
  const [viewTicketId, setViewTicketId] = useState<string | null>(null);
  const [viewFlightId, setViewFlightId] = useState<string | null>(null);
  const [viewHotelId, setViewHotelId] = useState<string | null>(null);
  const viewFlight = flights.data?.find((flight) => flight.id === viewFlightId);
  const viewHotel = hotels.data?.find((hotel) => hotel.id === viewHotelId);
  const viewTicket = tickets.data?.find((ticket) => ticket.id === viewTicketId);

  const add = () =>
    tab === 'flights'
      ? setFlightSheet({})
      : tab === 'hotels'
        ? setHotelSheet({})
        : setTicketSheet({});
  const addLabel = {
    flights: t('bookings.addFlight'),
    hotels: t('bookings.addHotel'),
    tickets: t('bookings.addTicket'),
  }[tab];

  return (
    <TripPage
      tripId={tripId}
      title={t('bookings.title')}
      onRefresh={() => {
        void flights.refetch();
        void hotels.refetch();
        void tickets.refetch();
      }}
      right={({ canWrite }) =>
        canWrite ? (
          <Button testID="add-booking" title={addLabel} icon="add" size="sm" onPress={add} />
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
              { value: 'tickets', label: t('bookings.tabTickets') },
            ]}
          />
          {tab === 'flights' ? (
            <FlightList
              query={flights}
              canWrite={canWrite}
              onAdd={() => setFlightSheet({})}
              onOpen={(flight) => setViewFlightId(flight.id)}
            />
          ) : tab === 'hotels' ? (
            <HotelList
              query={hotels}
              canWrite={canWrite}
              onAdd={() => setHotelSheet({})}
              onOpen={(hotel) => setViewHotelId(hotel.id)}
            />
          ) : (
            <TicketList
              query={tickets}
              canWrite={canWrite}
              onAdd={() => setTicketSheet({})}
              onOpen={(ticket) => setViewTicketId(ticket.id)}
            />
          )}
          <TicketDetailSheet
            tripId={tripId}
            currency={trip.currency}
            ticket={viewTicket}
            visible={viewTicketId !== null}
            onClose={() => setViewTicketId(null)}
            onEdit={
              canWrite
                ? () => {
                    setViewTicketId(null);
                    setTicketSheet({ ticket: viewTicket });
                  }
                : undefined
            }
          />
          <TicketSheet
            tripId={tripId}
            visible={ticketSheet !== null}
            onClose={() => setTicketSheet(null)}
            timezone={trip.timezone}
            currency={trip.currency}
            ticket={ticketSheet?.ticket}
          />
          <FlightDetailSheet
            tripId={tripId}
            currency={trip.currency}
            flight={viewFlight}
            visible={viewFlightId !== null}
            onClose={() => setViewFlightId(null)}
            onEdit={
              canWrite
                ? () => {
                    setViewFlightId(null);
                    setFlightSheet({ flight: viewFlight });
                  }
                : undefined
            }
          />
          <HotelDetailSheet
            tripId={tripId}
            currency={trip.currency}
            hotel={viewHotel}
            visible={viewHotelId !== null}
            onClose={() => setViewHotelId(null)}
            onEdit={
              canWrite
                ? () => {
                    setViewHotelId(null);
                    setHotelSheet({ hotel: viewHotel });
                  }
                : undefined
            }
          />
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
  onOpen,
}: {
  query: ListQuery<Flight>;
  canWrite: boolean;
  onAdd: () => void;
  onOpen: (flight: Flight) => void;
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
          tint="sky"
          title={`${flight.departureAirport} → ${flight.arrivalAirport} · ${flight.flightNumber}`}
          subtitle={`${formatZoned(flight.departure, locale)} → ${formatZoned(flight.arrival, locale)} · ${formatDuration(flight.durationMinutes)}`}
          right={
            flight.bookingCode ? <Badge label={flight.bookingCode} tone="accent" /> : undefined
          }
          onPress={() => onOpen(flight)}
        />
      ))}
    </Card>
  );
}

function HotelList({
  query,
  canWrite,
  onAdd,
  onOpen,
}: {
  query: ListQuery<Hotel>;
  canWrite: boolean;
  onAdd: () => void;
  onOpen: (hotel: Hotel) => void;
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
            tint="indigo"
            title={hotel.name}
            subtitle={`${formatZoned(hotel.checkIn, locale)} → ${formatZoned(hotel.checkOut, locale)} · ${t(nights === 1 ? 'bookings.nights.one' : 'bookings.nights.other', { count: nights })}`}
            right={
              hotel.confirmationCode ? (
                <Badge label={hotel.confirmationCode} tone="accent" />
              ) : undefined
            }
            onPress={() => onOpen(hotel)}
          />
        );
      })}
    </Card>
  );
}

function TicketList({
  query,
  canWrite,
  onAdd,
  onOpen,
}: {
  query: ListQuery<Ticket>;
  canWrite: boolean;
  onAdd: () => void;
  onOpen: (ticket: Ticket) => void;
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
        icon="ticket-outline"
        title={t('bookings.emptyTicketsTitle')}
        message={t('bookings.emptyTicketsMessage')}
        {...(canWrite ? { actionLabel: t('bookings.addTicket'), onAction: onAdd } : {})}
      />
    );
  }
  const locale = currentLocale();
  // The ones with a day come first, in order; the rest follow.
  const sorted = [...query.data].sort((a, b) =>
    (a.start ? zonedKey(a.start) : '~').localeCompare(b.start ? zonedKey(b.start) : '~'),
  );
  return (
    <Card padded={false}>
      {sorted.map((ticket, index) => {
        const visual = TICKET_VISUAL[ticket.kind];
        const where = ticket.location?.name ?? ticket.location?.address;
        const when = ticket.start
          ? `${formatZoned(ticket.start, locale)}${ticket.end ? ` – ${zonedTime(ticket.end)}` : ''}`
          : undefined;
        return (
          <ListRow
            key={ticket.id}
            testID={`ticket-${ticket.id}`}
            divider={index > 0}
            icon={visual.icon}
            tint={visual.tint}
            title={ticket.name}
            subtitle={
              [when, where].filter(Boolean).join(' · ') || t(`enums.ticketKind.${ticket.kind}`)
            }
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                {ticket.quantity > 1 ? (
                  <Badge label={`×${ticket.quantity}`} tone="neutral" />
                ) : null}
                {ticket.documentId ? <Badge label={t('bookings.hasFile')} tone="accent" /> : null}
              </View>
            }
            onPress={() => onOpen(ticket)}
          />
        );
      })}
    </Card>
  );
}
