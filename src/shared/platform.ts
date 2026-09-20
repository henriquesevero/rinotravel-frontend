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
