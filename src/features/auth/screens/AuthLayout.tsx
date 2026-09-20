import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { radius, space, useBreakpoint, useStyles, type Theme } from '@/shared/theme';
import { BrandMark, Icon, Screen, Text } from '@/shared/ui';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    split: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
    panel: {
      flex: 1,
      backgroundColor: colors.accent,
      padding: space.xxxl + space.lg,
      justifyContent: 'space-between',
      overflow: 'hidden',
    },
    circleLarge: {
      position: 'absolute',
      right: -140,
      top: -140,
      width: 440,
      height: 440,
      borderRadius: 220,
      backgroundColor: 'rgba(255,255,255,0.07)',
    },
    circleSmall: {
      position: 'absolute',
      left: -90,
      bottom: -110,
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    hero: { gap: space.xl, maxWidth: 480 },
    headline: { fontSize: 46, lineHeight: 52, fontWeight: '700', letterSpacing: -0.5 },
    points: { gap: space.lg, marginTop: space.md },
    point: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
    formSide: { flex: 1, backgroundColor: colors.background },
    formContent: { flexGrow: 1, justifyContent: 'center', maxWidth: 460, paddingVertical: space.xxl },
    header: { gap: space.sm, marginBottom: space.xl },
    banner: {
      backgroundColor: colors.accent,
      borderRadius: radius.xl,
      padding: space.xl,
      gap: space.md,
      marginBottom: space.xl,
      overflow: 'hidden',
    },
    footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: space.xs, marginTop: space.xl },
  });

/**
 * The frame of the sign-in and sign-up screens: on wide screens a brand panel beside the form,
 * on phones a brand banner above it.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const split = useBreakpoint() !== 'compact';

  const form = (
    <>
      <View style={styles.header}>
        <Text variant="largeTitle" heading>
          {title}
        </Text>
        <Text tone="secondary">{subtitle}</Text>
      </View>
      {children}
      <View style={styles.footer}>{footer}</View>
    </>
  );

  if (!split) {
    return (
      <Screen>
        <View style={styles.banner}>
          <BrandMark inverted />
          <Text tone="onAccent">{t('splash.tagline')}</Text>
        </View>
        {form}
      </Screen>
    );
  }

  return (
    <View style={styles.split}>
      <View style={styles.panel} testID="auth-panel">
        <View style={styles.circleLarge} />
        <View style={styles.circleSmall} />
        <BrandMark inverted size={48} />
        <View style={styles.hero}>
          <Text tone="onAccent" style={styles.headline} heading>
            {t('auth.panel.headline')}
          </Text>
          <Text variant="headline" tone="onAccent" style={{ fontWeight: '400' }}>
            {t('splash.tagline')}
          </Text>
          <View style={styles.points}>
            {(['point1', 'point2', 'point3'] as const).map((key) => (
              <View key={key} style={styles.point}>
                <Icon name="checkmark-circle" size={22} tone="onAccent" />
                <Text tone="onAccent" style={{ flex: 1 }}>
                  {t(`auth.panel.${key}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Text variant="footnote" tone="onAccent">
          {t('app.name')}
        </Text>
      </View>
      <View style={styles.formSide}>
        <Screen contentStyle={styles.formContent}>{form}</Screen>
      </View>
    </View>
  );
}
