import { StyleSheet, View } from 'react-native';

import type { Trip } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { space } from '@/shared/theme';
import { Badge, Card, Icon, Text } from '@/shared/ui';

import { RoleBadge } from '../members/components/RoleBadge';
import { useTripSummary } from './TripCard';

export function TripHero({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const summary = useTripSummary(trip);

  return (
    <Card>
      <View style={styles.badges}>
        <Badge label={summary.phaseLabel} tone={summary.phaseTone} />
        <RoleBadge role={trip.myRole} />
      </View>
      <View style={styles.row}>
        <Icon name="location-outline" size={18} tone="secondary" />
        <Text variant="headline">{trip.destination}</Text>
      </View>
      <View style={styles.row}>
        <Icon name="calendar-outline" size={18} tone="secondary" />
        <Text tone="secondary">
          {summary.range} · {summary.duration}
        </Text>
      </View>
      <View style={styles.meta}>
        <Meta label={t('trips.detail.currency')} value={trip.currency} />
        <Meta label={t('trips.detail.timezone')} value={trip.timezone.replaceAll('_', ' ')} />
      </View>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text variant="subhead">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xl, marginTop: space.md },
  metaItem: { gap: 2 },
});
