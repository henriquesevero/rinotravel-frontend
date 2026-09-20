import type { Flight, Hotel } from '@/core/api';
import { daysBetween, formatDuration, formatZoned, zonedDate } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { DetailSheet } from '@/features/content/DetailSheet';

interface Common {
  tripId: string;
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
      ]}
      notes={hotel?.notes}
      location={hotel?.location}
      testID="hotel-detail"
    />
  );
}
