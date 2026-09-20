import { StyleSheet, View } from 'react-native';

import { radius, space, useStyles, type Theme } from '../theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: space.md,
      paddingVertical: space.xxxl,
      paddingHorizontal: space.lg,
    },
    badge: {
      width: 72,
      height: 72,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: space.sm,
    },
    action: { marginTop: space.md, alignSelf: 'stretch' },
  });

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Icon name={icon} size={32} tone="accent" />
      </View>
      <Text variant="title" align="center" heading>
        {title}
      </Text>
      {message ? (
        <Text tone="secondary" align="center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} fullWidth />
        </View>
      ) : null}
    </View>
  );
}
