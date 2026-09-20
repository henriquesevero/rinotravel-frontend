/** Central registry so features can invalidate each other's caches without importing each other. */
export const queryKeys = {
  trips: {
    all: ['trips'] as const,
    list: () => [...queryKeys.trips.all, 'list'] as const,
    detail: (tripId: string) => [...queryKeys.trips.all, 'detail', tripId] as const,
  },
  /** Everything inside one trip lives under ['content', tripId] so a change can refresh it all. */
  content: {
    trip: (tripId: string) => ['content', tripId] as const,
    list: (tripId: string, entity: string) => ['content', tripId, entity] as const,
  },
  members: {
    list: (tripId: string) => ['members', tripId] as const,
  },
};
