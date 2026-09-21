import { useRouter } from 'expo-router';
import { View } from 'react-native';

import type { Flight, Hotel, Ticket } from '@/core/api';
import { formatMoney } from '@/core/datetime/money';
import {
  daysBetween,
  formatDuration,
  formatZoned,
  zonedDate,
  zonedTime,
} from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { DetailSheet } from '@/features/content/DetailSheet';
import { TICKET_VISUAL } from '@/features/content/visuals';
import { useDocuments, useOpenDocument } from '@/features/documents/hooks';
import { LinkedExpenses } from '@/features/expenses/LinkedExpenses';
import { space } from '@/shared/theme';
import { Banner, Button } from '@/shared/ui';

interface Common {
  tripId: string;
  currency: string;
  visible: boolean;
  onClose: () => void;
  onEdit?: (() => void) | undefined;
}

export function FlightDetailSheet({ flight, ...common }: Common & { flight: Flight | undefined }) {
  const { t } = useTranslation();
  const locale = currentLocale();
  const withZone = (moment: Flight['departure']) =>
    `${formatZoned(moment, locale)} (${moment.timezone.replaceAll('_', ' ')})`;
  return (
    <DetailSheet
      {...common}
      visible={common.visible && flight !== undefined}
      title={flight ? `${flight.departureAirport} → ${flight.arrivalAirport}` : ''}
      subtitle={
        flight ? [flight.airline, flight.flightNumber].filter(Boolean).join(' · ') : undefined
      }
      icon="airplane-outline"
      tint="sky"
      badges={flight?.bookingCode ? [{ label: flight.bookingCode, tone: 'accent' }] : []}
      rows={[
        { label: t('detail.departure'), value: flight ? withZone(flight.departure) : undefined },
        { label: t('detail.arrival'), value: flight ? withZone(flight.arrival) : undefined },
        {
          label: t('detail.duration'),
          value: flight ? formatDuration(flight.durationMinutes) : undefined,
        },
        { label: t('detail.terminal'), value: flight?.terminal },
        { label: t('detail.gate'), value: flight?.gate },
        { label: t('detail.seat'), value: flight?.seat },
        { label: t('detail.baggage'), value: flight?.baggage },
        {
          label: t('detail.cost'),
          value: flight?.cost
            ? formatMoney(flight.cost.amount, flight.cost.currency, locale)
            : undefined,
        },
      ]}
      notes={flight?.notes}
      testID="flight-detail"
    />
  );
}

export function HotelDetailSheet({ hotel, ...common }: Common & { hotel: Hotel | undefined }) {
  const { t } = useTranslation();
  const locale = currentLocale();
  const nights = hotel ? daysBetween(zonedDate(hotel.checkIn), zonedDate(hotel.checkOut)) : 0;
  return (
    <DetailSheet
      {...common}
      visible={common.visible && hotel !== undefined}
      title={hotel?.name ?? ''}
      subtitle={hotel?.location?.address}
      icon="bed-outline"
      tint="indigo"
      badges={hotel?.confirmationCode ? [{ label: hotel.confirmationCode, tone: 'accent' }] : []}
      rows={[
        {
          label: t('detail.checkIn'),
          value: hotel ? formatZoned(hotel.checkIn, locale) : undefined,
        },
        {
          label: t('detail.checkOut'),
          value: hotel ? formatZoned(hotel.checkOut, locale) : undefined,
        },
        {
          label: t('detail.stay'),
          value: hotel
            ? t(nights === 1 ? 'bookings.nights.one' : 'bookings.nights.other', { count: nights })
            : undefined,
        },
        { label: t('detail.phone'), value: hotel?.contactPhone },
        { label: t('detail.link'), value: hotel?.bookingUrl },
        {
          label: t('detail.cost'),
          value: hotel?.cost
            ? formatMoney(hotel.cost.amount, hotel.cost.currency, locale)
            : undefined,
        },
      ]}
      notes={hotel?.notes}
      location={hotel?.location}
      actions={
        hotel ? (
          <LinkedExpenses
            tripId={common.tripId}
            currency={common.currency}
            link={{ type: 'hotel', id: hotel.id }}
            canWrite={common.onEdit !== undefined}
            onNavigate={common.onClose}
          />
        ) : undefined
      }
      testID="hotel-detail"
    />
  );
}

export function TicketDetailSheet({ ticket, ...common }: Common & { ticket: Ticket | undefined }) {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = currentLocale();
  const documents = useDocuments(common.tripId);
  const open = useOpenDocument(common.tripId);
  const visual = TICKET_VISUAL[ticket?.kind ?? 'OTHER'];
  const file = ticket?.documentId
    ? documents.data?.find((document) => document.id === ticket.documentId)
    : undefined;
  const when = ticket?.start
    ? `${formatZoned(ticket.start, locale)}${ticket.end ? ` – ${zonedTime(ticket.end)}` : ''}`
    : undefined;
  // Still loading the documents is not the same as the file being gone.
  const missing = ticket?.documentId !== undefined && documents.data !== undefined && !file;

  return (
    <DetailSheet
      {...common}
      visible={common.visible && ticket !== undefined}
      title={ticket?.name ?? ''}
      subtitle={ticket ? t(`enums.ticketKind.${ticket.kind}`) : undefined}
      icon={visual.icon}
      tint={visual.tint}
      badges={[
        ...(ticket?.confirmationCode
          ? [{ label: ticket.confirmationCode, tone: 'accent' as const }]
          : []),
        ...(ticket && ticket.status !== 'PLANNED'
          ? [{ label: t(`enums.status.${ticket.status}`), tone: 'success' as const }]
          : []),
      ]}
      rows={[
        { label: t('detail.when'), value: when },
        {
          label: t('detail.quantity'),
          value: ticket && ticket.quantity > 1 ? String(ticket.quantity) : undefined,
        },
        { label: t('detail.seat'), value: ticket?.seat },
        {
          label: t('detail.cost'),
          value: ticket?.cost
            ? formatMoney(ticket.cost.amount, ticket.cost.currency, locale)
            : undefined,
        },
      ]}
      notes={ticket?.notes}
      location={ticket?.location}
      actions={
        <View style={{ gap: space.sm }}>
          {file?.status === 'READY' ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              <Button
                testID="ticket-open-file"
                title={t('tickets.openFile')}
                icon="open-outline"
                onPress={() => open.mutate(file.id)}
              />
              <Button
                testID="ticket-in-documents"
                title={t('tickets.inDocuments')}
                variant="secondary"
                icon="folder-open-outline"
                onPress={() => {
                  common.onClose();
                  router.push({ pathname: '/trips/[id]/documents', params: { id: common.tripId } });
                }}
              />
            </View>
          ) : null}
          {missing ? <Banner tone="info" message={t('tickets.unavailable')} /> : null}
          {ticket ? (
            <LinkedExpenses
              tripId={common.tripId}
              currency={common.currency}
              link={{ type: 'ticket', id: ticket.id }}
              canWrite={common.onEdit !== undefined}
              onNavigate={common.onClose}
            />
          ) : null}
        </View>
      }
      testID="ticket-detail"
    />
  );
}
