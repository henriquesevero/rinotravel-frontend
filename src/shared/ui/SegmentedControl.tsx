import { Pressable, StyleSheet, View } from 'react-native';

import { radius, space, useStyles, type Theme } from '../theme';
import { Text } from './Text';

export interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      padding: 3,
      gap: 2,
    },
    segment: {
      flex: 1,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md - 3,
      paddingHorizontal: space.md,
    },
    active: { backgroundColor: colors.surface },
  });

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  testID,
}: SegmentedControlProps<T>) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.track} role="tablist" testID={testID}>
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            testID={testID ? `${testID}-${segment.value}` : undefined}
            role="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(segment.value)}
            style={[styles.segment, active && styles.active]}
          >
            <Text
              variant="subhead"
              tone={active ? 'primary' : 'secondary'}
              style={active ? { fontWeight: '600' } : undefined}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
