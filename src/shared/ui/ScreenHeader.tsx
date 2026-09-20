import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/core/i18n';

import { space, useStyles, type Theme } from '../theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Shows a back button; goes to this route when there is no history (e.g. after a web reload). */
  backFallback?: Href;
  right?: ReactNode;
}

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    header: { paddingTop: space.sm, paddingBottom: space.lg, gap: space.xs },
    bar: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    inline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
      minHeight: 56,
    },
    titleBlock: { flex: 1, gap: space.xs, minWidth: 0 },
    back: { marginLeft: -space.sm },
  });

export function ScreenHeader({ title, subtitle, backFallback, right }: ScreenHeaderProps) {
  const styles = useStyles(createStyles);
  const router = useRouter();
  const { t } = useTranslation();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else if (backFallback) router.replace(backFallback);
  };

  const titleBlock = (
    <View style={styles.titleBlock}>
      {title ? (
        <Text variant="largeTitle" heading>
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text variant="callout" tone="secondary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  // A page with no back button puts its actions on the title's row; with one, actions ride the top bar.
  if (!backFallback) {
    return (
      <View style={[styles.header, styles.inline]}>
        {titleBlock}
        <View style={styles.actions}>{right}</View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.bar}>
        <View style={styles.back}>
          <IconButton icon="chevron-back" label={t('common.back')} onPress={goBack} />
        </View>
        <View style={styles.actions}>{right}</View>
      </View>
      {titleBlock}
    </View>
  );
}
