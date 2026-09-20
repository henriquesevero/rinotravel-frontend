import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/core/i18n';
import { radius, space, useStyles, type Theme } from '@/shared/theme';
import { Icon, Text } from '@/shared/ui';

import { useNavState } from './nav';

const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: space.sm,
    },
    tab: { flex: 1, alignItems: 'center', gap: 2, minHeight: 48, justifyContent: 'center' },
    center: { flex: 1, alignItems: 'center' },
    fab: {
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      marginTop: -space.xl,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: shadow.card,
      borderWidth: 4,
      borderColor: colors.surface,
    },
  });

interface BottomBarProps {
  onOpenAccount: () => void;
  accountOpen: boolean;
}

/** The phone menu: two destinations around a raised "new trip" action, unlike the desktop sidebar. */
export function BottomBar({ onOpenAccount, accountOpen }: BottomBarProps) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const nav = useNavState();
  const trips = nav.main[0];
  const create = nav.main[1];
  if (!trips || !create || nav.hidesTabBar) return null;

  const tripsActive = trips.active && !accountOpen;
  return (
    <View
      role="navigation"
      accessibilityLabel={t('nav.main')}
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}
    >
      <Pressable
        testID="nav-trips"
        accessibilityRole="button"
        accessibilityLabel={t('nav.trips')}
        accessibilityState={{ selected: tripsActive }}
        onPress={() => nav.go(trips.href)}
        style={styles.tab}
      >
        <Icon
          name={tripsActive ? trips.activeIcon : trips.icon}
          size={24}
          tone={tripsActive ? 'accent' : 'secondary'}
        />
        <Text variant="caption" tone={tripsActive ? 'accent' : 'secondary'}>
          {t('nav.trips')}
        </Text>
      </Pressable>

      <View style={styles.center}>
        <Pressable
          testID="nav-new"
          accessibilityRole="button"
          accessibilityLabel={t('nav.newTrip')}
          onPress={() => nav.go(create.href)}
          style={styles.fab}
        >
          <Icon name="add" size={28} tone="onAccent" />
        </Pressable>
      </View>

      <Pressable
        testID="open-account"
        accessibilityRole="button"
        accessibilityLabel={t('auth.account.open')}
        accessibilityState={{ selected: accountOpen }}
        onPress={onOpenAccount}
        style={styles.tab}
      >
        <Icon
          name={accountOpen ? 'person-circle' : 'person-circle-outline'}
          size={26}
          tone={accountOpen ? 'accent' : 'secondary'}
        />
        <Text variant="caption" tone={accountOpen ? 'accent' : 'secondary'}>
          {t('nav.account')}
        </Text>
      </Pressable>
    </View>
  );
}
