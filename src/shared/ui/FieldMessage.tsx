import { StyleSheet, View } from 'react-native';

import { space } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';

/** Error (preferred) or hint text shown under a form control. */
export function FieldMessage({
  error,
  hint,
}: {
  error?: string | undefined;
  hint?: string | undefined;
}) {
  if (error) {
    return (
      <View style={styles.error}>
        <Icon name="alert-circle" size={16} tone="danger" />
        <Text variant="footnote" tone="danger" role="alert">
          {error}
        </Text>
      </View>
    );
  }
  if (hint) {
    return (
      <Text variant="footnote" tone="secondary">
        {hint}
      </Text>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  error: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
