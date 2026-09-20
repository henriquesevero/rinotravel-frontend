import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { contentMaxWidth, space, useStyles, useTheme, type Theme } from '../theme';
import { OfflineBanner } from './OfflineBanner';

interface ScreenProps {
  children: ReactNode;
  /** Wraps the content in a ScrollView. Turn off when the child is a list that scrolls itself. */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Sticky area under the content, e.g. a primary action. */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    column: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
    scrollContent: { flexGrow: 1 },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
  });

/** Horizontal padding and max width for content that is not inside <Screen scroll>. */
export function useContentStyle(): ViewStyle {
  const insets = useSafeAreaInsets();
  return {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: insets.bottom + space.xxl,
  };
}

export function Screen({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  footer,
  contentStyle,
}: ScreenProps) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const padding = useContentStyle();

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        ) : undefined
      }
    >
      <View style={[padding, contentStyle]}>{children}</View>
    </ScrollView>
  ) : (
    <View style={styles.flex}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <OfflineBanner />
        {body}
      </View>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <View style={[styles.column, { padding: space.lg }]}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
