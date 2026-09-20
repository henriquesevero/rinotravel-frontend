import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { dayParts } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { radius, space, useStyles, type Theme } from '@/shared/theme';
import { IconButton, SegmentedControl, Text } from '@/shared/ui';

export interface DayOption {
  date: string;
  /** How many places of that day the map can show. */
  count: number;
}

interface DayNavigatorProps {
  days: DayOption[];
  selected: string;
  onSelect: (date: string) => void;
  scope: 'day' | 'trip';
  onScope: (scope: 'day' | 'trip') => void;
}

const CHIP = 54;
const GAP = 6;

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    root: { gap: space.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    strip: { gap: GAP, paddingVertical: space.xs, paddingHorizontal: 2 },
    chip: {
      width: CHIP,
      height: 58,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
    },
    chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
    dot: { width: 5, height: 5, borderRadius: 3 },
  });

/**
 * Chooses what the map shows: one day at a time, moving with the arrows or by picking any day of the
 * trip (days with nothing to map are there too, so the strip matches the itinerary), or the whole trip.
 */
export function DayNavigator({ days, selected, onSelect, scope, onScope }: DayNavigatorProps) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const strip = useRef<ScrollView>(null);
  const index = days.findIndex((day) => day.date === selected);

  // Keep the chosen day in view when it changes from outside (the arrows, or a click in the list).
  useEffect(() => {
    if (scope === 'day' && index >= 0) {
      strip.current?.scrollTo({
        x: Math.max(0, index * (CHIP + GAP) - 2 * (CHIP + GAP)),
        animated: true,
      });
    }
  }, [index, scope]);

  const move = (step: number) => {
    const next = days[index + step];
    if (next) onSelect(next.date);
  };

  return (
    <View style={styles.root} testID="day-navigator">
      <SegmentedControl
        testID="map-scope"
        value={scope}
        onChange={onScope}
        segments={[
          { value: 'day', label: t('dayMap.scope.day') },
          { value: 'trip', label: t('dayMap.scope.trip') },
        ]}
      />
      {scope === 'day' ? (
        <View style={styles.row}>
          <IconButton
            icon="chevron-back"
            tone="secondary"
            label={t('dayMap.prevDay')}
            onPress={() => move(-1)}
            testID="map-prev-day"
          />
          <ScrollView
            ref={strip}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.strip}
            style={{ flex: 1 }}
          >
            {days.map((day) => {
              const parts = dayParts(day.date, currentLocale());
              const active = day.date === selected;
              return (
                <Pressable
                  key={day.date}
                  testID={`map-day-${day.date}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${parts.day} ${parts.month}`}
                  onPress={() => onSelect(day.date)}
                  style={[styles.chip, active && styles.chipSelected]}
                >
                  <Text
                    variant="caption"
                    tone={active ? 'onAccent' : 'secondary'}
                    style={{ fontWeight: '700' }}
                  >
                    {parts.month.toUpperCase()}
                  </Text>
                  <Text variant="headline" tone={active ? 'onAccent' : 'primary'} numeric>
                    {parts.day}
                  </Text>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          day.count > 0 ? (active ? '#FFFFFF' : '#2563EB') : 'transparent',
                      },
                    ]}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
          <IconButton
            icon="chevron-forward"
            tone="secondary"
            label={t('dayMap.nextDay')}
            onPress={() => move(1)}
            testID="map-next-day"
          />
        </View>
      ) : null}
    </View>
  );
}
