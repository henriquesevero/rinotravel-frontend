import { StyleSheet, View } from 'react-native';

import { addDays, formatDayShort } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { TimelineRow } from '@/features/content/TimelineRow';
import { space, useStyles, type Theme } from '@/shared/theme';
import { Card, Text } from '@/shared/ui';

import type { AgendaDay } from './agenda';

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    day: { paddingHorizontal: space.lg, paddingTop: space.md },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    entries: { paddingBottom: space.xs },
  });

/** Entries grouped by day inside one card, with "Today" and "Tomorrow" spelled out. */
export function AgendaList({
  days,
  today,
  showDayLabels = true,
}: {
  days: AgendaDay[];
  today: string;
  /** Off when the section title already says which day it is ("Today"). */
  showDayLabels?: boolean;
}) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const locale = currentLocale();

  const label = (date: string) =>
    date === today
      ? t('common.today')
      : date === addDays(today, 1)
        ? t('common.tomorrow')
        : formatDayShort(date, locale);

  return (
    <Card padded={false} testID="agenda">
      {days.map((day, index) => (
        <View key={day.date} style={[styles.day, index > 0 && styles.divider]}>
          {showDayLabels ? (
            <Text variant="caption" tone="secondary">
              {label(day.date).toUpperCase()}
            </Text>
          ) : null}
          <View style={styles.entries}>
            {day.entries.map((entry) => (
              <TimelineRow key={`${entry.kind}-${entry.id}`} entry={entry} />
            ))}
          </View>
        </View>
      ))}
    </Card>
  );
}
