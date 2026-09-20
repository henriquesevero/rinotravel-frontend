import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/core/i18n';
import { radius, space, useStyles, type Theme } from '@/shared/theme';
import { Icon, Text, type IconName } from '@/shared/ui';

import { MoreSheet } from './MoreSheet';
import { PHONE_TRIP_TABS, useNavState, type NavItem } from './nav';

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

interface TabProps {
  testID: string;
  label: string;
  icon: IconName;
  activeIcon: IconName;
  active: boolean;
  onPress: () => void;
}

function Tab({ testID, label, icon, activeIcon, active, onPress }: TabProps) {
  const styles = useStyles(createStyles);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.tab}
    >
      <Icon name={active ? activeIcon : icon} size={24} tone={active ? 'accent' : 'secondary'} />
      <Text variant="caption" tone={active ? 'accent' : 'secondary'} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The phone menu, unlike the desktop sidebar. Home and lists get two tabs around a raised "new trip"
 * action; inside a trip the bar becomes that trip's sections with the rest under "More".
 */
export function BottomBar({ onOpenAccount, accountOpen }: BottomBarProps) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const nav = useNavState();
  const [moreOpen, setMoreOpen] = useState(false);
  if (nav.hidesTabBar) return null;

  const frame = (children: React.ReactNode) => (
    <View
      role="navigation"
      accessibilityLabel={t('nav.main')}
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}
    >
      {children}
    </View>
  );

  if (nav.tripId) {
    const visible = nav.trip.slice(0, PHONE_TRIP_TABS);
    const overflow = nav.trip.slice(PHONE_TRIP_TABS);
    const overflowActive = overflow.some((item) => item.active) && !accountOpen;
    return (
      <>
        {frame(
          <>
            {visible.map((item: NavItem) => (
              <Tab
                key={item.key}
                testID={`nav-${item.key}`}
                label={t(item.labelKey)}
                icon={item.icon}
                activeIcon={item.activeIcon}
                active={item.active && !moreOpen}
                onPress={() => nav.go(item.href)}
              />
            ))}
            <Tab
              testID="nav-more"
              label={t('nav.more')}
              icon="ellipsis-horizontal-circle-outline"
              activeIcon="ellipsis-horizontal-circle"
              active={overflowActive || moreOpen}
              onPress={() => setMoreOpen(true)}
            />
          </>,
        )}
        <MoreSheet
          visible={moreOpen}
          onClose={() => setMoreOpen(false)}
          nav={nav}
          overflow={overflow}
          onOpenAccount={onOpenAccount}
        />
      </>
    );
  }

  const dashboard = nav.main[0];
  const trips = nav.main[1];
  const create = nav.main[2];
  if (!dashboard || !trips || !create) return null;

  return frame(
    <>
      <Tab
        testID="nav-dashboard"
        label={t('nav.dashboard')}
        icon={dashboard.icon}
        activeIcon={dashboard.activeIcon}
        active={dashboard.active && !accountOpen}
        onPress={() => nav.go(dashboard.href)}
      />
      <Tab
        testID="nav-trips"
        label={t('nav.trips')}
        icon={trips.icon}
        activeIcon={trips.activeIcon}
        active={trips.active && !accountOpen}
        onPress={() => nav.go(trips.href)}
      />
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
      <Tab
        testID="open-account"
        label={t('nav.account')}
        icon="person-circle-outline"
        activeIcon="person-circle"
        active={accountOpen}
        onPress={onOpenAccount}
      />
    </>,
  );
}
