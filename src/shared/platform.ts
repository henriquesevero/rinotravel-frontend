import { Platform } from 'react-native';

/** Apple Maps only exists on Apple devices, so the button that opens it is offered only there. */
export function isApplePlatform(): boolean {
  if (Platform.OS === 'ios' || Platform.OS === 'macos') return true;
  return (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
  );
}

/**
 * Phone browsers and native apps open Google Maps links with far fewer stops than a computer does
 * (three in between, against nine), so route links are cut into smaller parts there.
 */
export function isMobileDevice(): boolean {
  if (Platform.OS !== 'web') return true;
  return (
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
}
