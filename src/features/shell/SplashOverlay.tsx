import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useTranslation } from '@/core/i18n';
import { space } from '@/shared/theme';
import { BrandMark, Text } from '@/shared/ui';

const BRAND = '#2563EB';
const MIN_VISIBLE_MS = 1400;
const FADE_MS = 380;

/** True once the splash has played in this session, so returning to the tree never replays it. */
let played = false;

interface SplashOverlayProps {
  /** The app is ready to show; the splash still honors a minimum display time. */
  ready: boolean;
}

export function SplashOverlay({ ready }: SplashOverlayProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(!played);
  const [minElapsed, setMinElapsed] = useState(played);
  const enter = useSharedValue(0);
  const textEnter = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    // The native splash uses the same brand color, so hiding it here hands over seamlessly.
    void SplashScreen.hideAsync();
    if (played) return undefined;
    enter.value = withTiming(1, {
      duration: reduceMotion ? 0 : 700,
      easing: Easing.out(Easing.cubic),
    });
    const timer = setTimeout(() => setMinElapsed(true), reduceMotion ? 500 : MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [enter, textEnter, reduceMotion]);

  const leaving = ready && minElapsed;
  useEffect(() => {
    if (!leaving || !mounted) return undefined;
    exit.value = withTiming(1, { duration: reduceMotion ? 0 : FADE_MS });
    const timer = setTimeout(
      () => {
        played = true;
        setMounted(false);
      },
      reduceMotion ? 0 : FADE_MS,
    );
    return () => clearTimeout(timer);
  }, [leaving, mounted, exit, reduceMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ scale: 1 + exit.value * 0.04 }],
  }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: 0.8 + enter.value * 0.2 }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: withDelay(
      reduceMotion ? 0 : 250,
      withTiming(enter.value, { duration: reduceMotion ? 0 : 500 }),
    ),
    transform: [{ translateY: (1 - enter.value) * 8 }],
  }));

  if (!mounted) return null;
  return (
    <Animated.View
      testID="splash"
      accessibilityLabel={t('app.name')}
      style={[styles.container, containerStyle]}
      pointerEvents={leaving ? 'none' : 'auto'}
    >
      <Animated.View style={markStyle}>
        <BrandMark inverted size={72} compact />
      </Animated.View>
      <Animated.View style={[styles.text, textStyle]}>
        <Text variant="largeTitle" tone="onAccent" align="center">
          {t('app.name')}
        </Text>
        <Text tone="onAccent" align="center">
          {t('splash.tagline')}
        </Text>
      </Animated.View>
      <View />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xl,
    padding: space.xl,
  },
  text: { gap: space.sm, alignItems: 'center' },
});
