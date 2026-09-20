import { StyleSheet, View } from 'react-native';

import { FONT_FAMILY, radius, space, typography, useTheme } from '../theme';
import type { DateFieldProps } from './DateField.types';
import { FieldMessage } from './FieldMessage';
import { Text } from './Text';

export function DateField({ label, value, onChange, error, testID }: DateFieldProps) {
  const { colors, scheme } = useTheme();
  return (
    <View style={styles.container}>
      <Text variant="subhead" tone="secondary">
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
          minHeight: 52,
          boxSizing: 'border-box',
          width: '100%',
          padding: `0 ${space.lg}px`,
          borderRadius: radius.md,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          backgroundColor: colors.surface,
          color: colors.text,
          colorScheme: scheme,
          fontFamily: FONT_FAMILY.regular,
          fontSize: typography.body.fontSize,
        }}
      />
      <FieldMessage error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.xs + 2 },
});
