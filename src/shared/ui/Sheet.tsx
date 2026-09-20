import { useEffect, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/core/i18n';

import { motion, radius, space, useStyles, useTheme, type Theme } from '../theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const SLIDE_DISTANCE = 600;
const DIALOG_BREAKPOINT = 768;

const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    root: { flex: 1 },
    wrap: { flex: 1, pointerEvents: 'box-none' },
    sheetWrap: { justifyContent: 'flex-end' },
    dialogWrap: { justifyContent: 'center', alignItems: 'center', padding: space.xl },
    panel: {
      backgroundColor: colors.surface,
      boxShadow: shadow.sheet,
      maxHeight: '88%',
      width: '100%',
      alignSelf: 'center',
    },
    sheetPanel: {
      maxWidth: 640,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
    },
    dialogPanel: { maxWidth: 480, borderRadius: radius.xl },
    grabber: {
      alignSelf: 'center',
      width: 36,
      height: 5,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      marginTop: space.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: space.xl,
      paddingRight: space.sm,
      paddingTop: space.sm,
      minHeight: 56,
    },
    title: { flex: 1 },
    body: { flexShrink: 1 },
    bodyContent: { paddingHorizontal: space.xl, paddingBottom: space.lg, gap: space.lg },
    footer: { paddingHorizontal: space.xl, paddingTop: space.md, gap: space.sm },
  });

export function Sheet({ visible, onClose, title, children, footer }: SheetProps) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const dialog = width >= DIALOG_BREAKPOINT;

  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);

  // Keep the Modal mounted while it animates out; unmount only after the exit finishes.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    const duration = reduceMotion ? 0 : motion.base;
    if (visible) {
      progress.value = withTiming(1, { duration });
      return undefined;
    }
    progress.value = withTiming(0, { duration });
    const timer = setTimeout(() => setMounted(false), duration);
    return () => clearTimeout(timer);
  }, [visible, reduceMotion, progress]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panelStyle = useAnimatedStyle(() =>
    dialog
      ? {
          opacity: progress.value,
          transform: [{ scale: interpolate(progress.value, [0, 1], [0.96, 1]) }],
        }
      : { transform: [{ translateY: interpolate(progress.value, [0, 1], [SLIDE_DISTANCE, 0]) }] },
  );

  // The Modal must only exist while the sheet is open: on the web each Modal owns a portal that
  // is created on mount, so an always-mounted sheet would sit beneath every sheet opened later.
  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, scrimStyle]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={onClose}
          />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.wrap, dialog ? styles.dialogWrap : styles.sheetWrap]}
        >
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.panel,
              dialog ? styles.dialogPanel : styles.sheetPanel,
              { paddingBottom: dialog ? space.lg : Math.max(insets.bottom, space.lg) },
              panelStyle,
            ]}
          >
            {dialog ? null : <View style={styles.grabber} />}
            <View style={styles.header}>
              <Text variant="headline" heading style={styles.title}>
                {title}
              </Text>
              <IconButton
                icon="close"
                tone="secondary"
                label={t('common.close')}
                onPress={onClose}
              />
            </View>
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
