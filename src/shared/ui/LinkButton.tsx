import { Pressable, StyleSheet, type PressableStateCallbackType } from 'react-native';

import { radius, space, useStyles, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface LinkButtonProps {
  title: string;
  onPress: () => void;
  icon?: IconName;
  /** Keeps the pressed look on, e.g. while this is the day shown on the map beside it. */
  active?: boolean;
  testID?: string;
}

const createStyles = () =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      paddingVertical: space.xs,
      paddingHorizontal: space.xs,
      borderRadius: radius.sm,
      alignSelf: 'flex-start',
    },
  });

function hovered(state: PressableStateCallbackType): boolean {
  return Boolean((state as PressableStateCallbackType & { hovered?: boolean }).hovered);
}

/**
 * A plain text action: an icon and a label, no pill and no fill. For a row of small actions that
 * should stay quiet next to bolder content, such as a card's own header.
 */
export function LinkButton({ title, onPress, icon, active = false, testID }: LinkButtonProps) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={(state) => [
        styles.base,
        (active || state.pressed || hovered(state)) && { backgroundColor: colors.accentSoft },
      ]}
    >
      {icon ? <Icon name={icon} size={16} tone="accent" /> : null}
      <Text variant="subhead" tone="accent" style={{ fontWeight: '600' }}>
        {title}
      </Text>
    </Pressable>
  );
}
