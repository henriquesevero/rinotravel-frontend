import { StyleSheet, View } from 'react-native';

import { FONT_FAMILY, radius, space, useFieldMetrics, useTheme } from '../theme';
import type { DateFieldProps } from './DateField.types';
import { FieldMessage } from './FieldMessage';
import { Text } from './Text';

export function DateField({ label, value, onChange, error, testID }: DateFieldProps) {
  const { colors, scheme } = useTheme();
  const metrics = useFieldMetrics();
  return (
    <View style={styles.container}>
      <Text variant={metrics.dense ? 'footnote' : 'subhead'} tone="secondary" style={styles.label}>
        {label}
      </Text>
      <input
        type="date"
        data-testid={testID}
        aria-label={label}
        aria-invalid={!!error}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          minHeight: metrics.height,
          boxSizing: 'border-box',
          width: '100%',
          padding: `0 ${space.lg}px`,
          borderRadius: radius.md,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          backgroundColor: colors.surface,
          color: colors.text,
          colorScheme: scheme,
          fontFamily: FONT_FAMILY.regular,
          fontSize: metrics.fontSize,
        }}
      />
      <FieldMessage error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.xs + 1 },
  label: { fontWeight: '500' },
});
