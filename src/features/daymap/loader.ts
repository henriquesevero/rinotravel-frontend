let loading: Promise<void> | null = null;

declare global {
  interface Window {
    __rinoMapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}

/**
 * Loads the Google Maps JavaScript API once. The key is a browser key restricted to this site's
 * address, which is the way that API is meant to be used.
 */
export function loadGoogleMaps(key: string, language: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (typeof window.google?.maps?.importLibrary === 'function') return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    window.__rinoMapsReady = () => resolve();
    const script = document.createElement('script');
    script.async = true;
    script.src =
      'https://maps.googleapis.com/maps/api/js?' +
      new URLSearchParams({
        key,
        v: 'weekly',
        loading: 'async',
        language,
        callback: '__rinoMapsReady',
      }).toString();
    script.onerror = () => {
      loading = null;
      reject(new Error('The Google Maps script could not be loaded'));
    };
    document.head.appendChild(script);
  });
  return loading;
}
