export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080',
  // A browser key restricted to the Maps Embed API and to this site's address. It ships in the bundle
  // on purpose (that is how embeds work), so it must never be the server key. Empty hides the map.
  googleEmbedKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? '',
} as const;
