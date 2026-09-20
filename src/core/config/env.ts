export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080',
  // A browser key restricted to the Maps JavaScript API and to this site's address: it ships in the
  // bundle on purpose (that is how a map in the page works), so it must never be the server key.
  // Empty means no interactive map: the day is shown as a picture drawn by the server instead.
  googleMapsBrowserKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ?? '',
} as const;
