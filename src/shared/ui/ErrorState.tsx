import { StyleSheet, View } from 'react-native';

import { isNetworkError } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';

import { space, useStyles, type Theme } from '../theme';
import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

interface ErrorStateProps {
  error: unknown;
  /** Context shown above the specific reason, e.g. "We could not load your trips." */
  title: string;
  onRetry?: () => void;
}

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: space.md,
      paddingVertical: space.xxxl,
      paddingHorizontal: space.lg,
    },
    action: { marginTop: space.sm, alignSelf: 'stretch' },
  });

export function ErrorState({ error, title, onRetry }: ErrorStateProps) {
  const styles = useStyles(createStyles);
  const describe = useDescribeError();
  const { t } = useTranslation();

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Icon
        name={isNetworkError(error) ? 'cloud-offline-outline' : 'alert-circle-outline'}
        size={40}
        tone="secondary"
      />
      <Text variant="headline" align="center">
        {title}
      </Text>
      <Text tone="secondary" align="center">
        {describe(error)}
      </Text>
      {onRetry ? (
        <View style={styles.action}>
          <Button title={t('common.retry')} variant="secondary" onPress={onRetry} fullWidth />
        </View>
      ) : null}
    </View>
  );
}
