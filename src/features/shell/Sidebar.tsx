import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type PressableStateCallbackType,
} from 'react-native';

import { useTranslation } from '@/core/i18n';
import { useMe } from '@/features/auth';
import { useTrip } from '@/features/trips';
import { radius, space, useStyles, useTheme, type Theme } from '@/shared/theme';
import { Avatar, BrandMark, Icon, Text } from '@/shared/ui';

import { useNavState, type NavItem } from './nav';

const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 76;

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    sidebar: {
      backgroundColor: colors.surface,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.border,
      paddingVertical: space.lg,
    },
    brand: {
      paddingHorizontal: space.lg,
      paddingBottom: space.xl,
      minHeight: 56,
      justifyContent: 'center',
    },
    scroll: { flex: 1 },
    section: { paddingHorizontal: space.md, gap: space.xs, marginBottom: space.lg },
    sectionTitle: { paddingHorizontal: space.md, paddingBottom: space.xs },
    item: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingHorizontal: space.md,
      borderRadius: radius.md,
    },
    itemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
    itemHover: { backgroundColor: colors.surfaceMuted },
    itemActive: { backgroundColor: colors.accentSoft },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginHorizontal: space.lg,
    },
    user: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      marginHorizontal: space.md,
      marginTop: space.md,
      padding: space.sm,
      borderRadius: radius.md,
    },
    userCollapsed: { justifyContent: 'center' },
    themeRow: { marginTop: space.sm, paddingVertical: space.sm, paddingHorizontal: space.md },
    userText: { flex: 1, minWidth: 0 },
  });

function hovered(state: PressableStateCallbackType): boolean {
  return Boolean((state as PressableStateCallbackType & { hovered?: boolean }).hovered);
}

interface SidebarProps {
  collapsed: boolean;
  onOpenAccount: () => void;
}

export function Sidebar({ collapsed, onOpenAccount }: SidebarProps) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const nav = useNavState();
  const me = useMe();
  const { scheme, setPreference } = useTheme();
  const trip = useTrip(nav.tripId ?? '');

  return (
    <View
      role="navigation"
      accessibilityLabel={t('nav.main')}
      style={[styles.sidebar, { width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }]}
    >
      <View style={[styles.brand, collapsed && { alignItems: 'center', paddingHorizontal: 0 }]}>
        <BrandMark compact={collapsed} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {nav.main.map((item) => (
            <SidebarItem
              key={item.key}
              item={item}
              collapsed={collapsed}
              onPress={() => nav.go(item.href)}
            />
          ))}
        </View>

        {nav.tripId ? (
          <View style={styles.section}>
            {collapsed ? (
              <View style={styles.divider} />
            ) : (
              <View style={styles.sectionTitle}>
                <Text variant="caption" tone="secondary">
                  {t('nav.currentTrip').toUpperCase()}
                </Text>
                <Text variant="subhead" numberOfLines={1} style={{ fontWeight: '600' }}>
                  {trip.data?.name ?? ''}
                </Text>
              </View>
            )}
            {nav.trip.map((item) => (
              <SidebarItem
                key={item.key}
                item={item}
                collapsed={collapsed}
                onPress={() => nav.go(item.href)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.divider} />
      <Pressable
        testID="toggle-theme"
        accessibilityRole="button"
        accessibilityLabel={t(scheme === 'dark' ? 'nav.themeToLight' : 'nav.themeToDark')}
        onPress={() => setPreference(scheme === 'dark' ? 'light' : 'dark')}
        style={(state) => [
          styles.user,
          styles.themeRow,
          collapsed && styles.userCollapsed,
          hovered(state) && styles.itemHover,
        ]}
      >
        <Icon
          name={scheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
          size={20}
          tone="secondary"
        />
        {collapsed ? null : (
          <Text variant="subhead" tone="secondary">
            {t(scheme === 'dark' ? 'nav.themeToLight' : 'nav.themeToDark')}
          </Text>
        )}
      </Pressable>
      <Pressable
        testID="open-account"
        accessibilityRole="button"
        accessibilityLabel={t('auth.account.open')}
        onPress={onOpenAccount}
        style={(state) => [
          styles.user,
          collapsed && styles.userCollapsed,
          hovered(state) && styles.itemHover,
        ]}
      >
        <Avatar name={me.data?.name ?? '?'} size={36} />
        {collapsed ? null : (
          <View style={styles.userText}>
            <Text variant="subhead" numberOfLines={1} style={{ fontWeight: '600' }}>
              {me.data?.name ?? ''}
            </Text>
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {me.data?.email ?? ''}
            </Text>
          </View>
        )}
        {collapsed ? null : <Icon name="ellipsis-horizontal" size={18} tone="secondary" />}
      </Pressable>
    </View>
  );
}

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
  onPress: () => void;
}

function SidebarItem({ item, collapsed, onPress }: SidebarItemProps) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const label = t(item.labelKey);

  return (
    <Pressable
      testID={`nav-${item.key}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: item.active }}
      onPress={onPress}
      style={(state) => [
        styles.item,
        collapsed && styles.itemCollapsed,
        hovered(state) && !item.active && styles.itemHover,
        item.active && styles.itemActive,
      ]}
    >
      <Icon
        name={item.active ? item.activeIcon : item.icon}
        size={22}
        tone={item.active ? 'accent' : 'secondary'}
      />
      {collapsed ? null : (
        <Text
          tone={item.active ? 'accent' : 'primary'}
          style={item.active ? { fontWeight: '600' } : undefined}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
