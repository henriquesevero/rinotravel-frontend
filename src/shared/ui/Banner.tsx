import { Pressable, StyleSheet, View } from 'react-native';

import { radius, space, useStyles, useTheme, type Theme, type ThemeColors } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text, type TextTone } from './Text';

type Tone = 'info' | 'warning' | 'danger';

interface BannerProps {
  tone?: Tone;
  title?: string;
  message: string;
  action?: { label: string; onPress: () => void };
  testID?: string;
}

const palette: Record<Tone, { background: keyof ThemeColors; text: TextTone; icon: IconName }> = {
  info: { background: 'accentSoft', text: 'accent', icon: 'information-circle' },
  warning: { background: 'warningSoft', text: 'warning', icon: 'warning' },
  danger: { background: 'dangerSoft', text: 'danger', icon: 'alert-circle' },
};

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      gap: space.md,
      padding: space.md + 2,
      borderRadius: radius.md,
      alignItems: 'flex-start',
    },
    body: { flex: 1, gap: space.xs },
    action: { alignSelf: 'flex-start', paddingVertical: space.xs },
  });

export function Banner({ tone = 'info', title, message, action, testID }: BannerProps) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const { background, text, icon } = palette[tone];

  return (
    <View
      testID={testID}
      role="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: colors[background] }]}
    >
      <Icon name={icon} size={20} tone={text} />
      <View style={styles.body}>
        {title ? (
          <Text variant="subhead" tone={text} style={{ fontWeight: '600' }}>
            {title}
          </Text>
        ) : null}
        <Text variant="subhead" tone={text}>
          {message}
        </Text>
        {action ? (
          <Pressable accessibilityRole="button" onPress={action.onPress} style={styles.action}>
            <Text
              variant="subhead"
              tone={text}
              style={{ fontWeight: '700', textDecorationLine: 'underline' }}
            >
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
