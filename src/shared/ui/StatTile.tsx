import { StyleSheet, View } from 'react-native';

import { radius, space, useStyles, type Theme } from '../theme';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface StatTileProps {
  icon: IconName;
  value: string;
  label: string;
  onPress?: () => void;
  testID?: string;
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    badge: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: space.md,
    },
  });

export function StatTile({ icon, value, label, onPress, testID }: StatTileProps) {
  const styles = useStyles(createStyles);
  return (
    <Card
      testID={testID}
      accessibilityLabel={`${label}: ${value}`}
      {...(onPress ? { onPress } : {})}
      style={{ flex: 1, minWidth: 140 }}
    >
      <View style={styles.badge}>
        <Icon name={icon} size={20} tone="accent" />
      </View>
      <Text variant="title" heading numeric>
        {value}
      </Text>
      <Text variant="footnote" tone="secondary">
        {label}
      </Text>
    </Card>
  );
}
