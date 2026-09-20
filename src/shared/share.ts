import { Share } from 'react-native';

export type ShareResult = 'shared' | 'copied' | 'dismissed' | 'failed';

/**
 * Opens the system share sheet. Desktop browsers usually have none, so there the text is copied
 * instead and the caller can say so.
 */
export async function shareText(message: string): Promise<ShareResult> {
  try {
    const result = await Share.share({ message });
    return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch (error) {
    // A cancelled share sheet in some browsers rejects; everything else falls through to copying.
    if (error instanceof Error && error.name === 'AbortError') return 'dismissed';
    return copyText(message);
  }
}

async function copyText(message: string): Promise<ShareResult> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      return 'copied';
    }
  } catch {
    // Permission denied or an insecure page: nothing else to try.
  }
  return 'failed';
}
