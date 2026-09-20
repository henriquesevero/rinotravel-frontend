import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { radius, tintColors, useTheme, type Tint } from '../theme';
import type { IconName } from './Icon';

interface IconBadgeProps {
  icon: IconName;
  tint?: Tint;
  size?: number;
  /** A round badge for people and places, a rounded square for things. */
  round?: boolean;
}

/** An icon on a soft coloured tile: the visual anchor of list rows, timeline entries and stats. */
export function IconBadge({ icon, tint = 'blue', size = 40, round = false }: IconBadgeProps) {
  const { scheme } = useTheme();
  const { bg, fg } = tintColors(scheme, tint);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: round ? radius.pill : Math.round(size * 0.3),
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        name={icon}
        size={Math.round(size * 0.5)}
        color={fg}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </View>
  );
}
