import { api, unwrap } from '@/core/api';
import type {
  Flight,
  FlightCreate,
  FlightPatch,
  Hotel,
  HotelCreate,
  HotelPatch,
  Ticket,
  TicketCreate,
  TicketPatch,
} from '@/core/api';
import type { ResourceApi } from '@/core/resource/hooks';

const path = (tripId: string) => ({ params: { path: { tripId } } });
const pathWithId = (tripId: string, id: string) => ({ params: { path: { tripId, id } } });
const abort = (signal?: AbortSignal) => (signal ? { signal } : {});

export const flightsApi: ResourceApi<Flight, FlightCreate, FlightPatch> = {
  list: async (tripId, signal) =>
    (await unwrap(api.GET('/api/v1/trips/{tripId}/flights', { ...path(tripId), ...abort(signal) })))
      .items,
  create: (tripId, body) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/flights', { ...path(tripId), body })),
  update: (tripId, id, body) =>
    unwrap(api.PATCH('/api/v1/trips/{tripId}/flights/{id}', { ...pathWithId(tripId, id), body })),
  remove: async (tripId, id) => {
    await unwrap(api.DELETE('/api/v1/trips/{tripId}/flights/{id}', pathWithId(tripId, id)));
  },
};

export const hotelsApi: ResourceApi<Hotel, HotelCreate, HotelPatch> = {
  list: async (tripId, signal) =>
    (await unwrap(api.GET('/api/v1/trips/{tripId}/hotels', { ...path(tripId), ...abort(signal) })))
      .items,
  create: (tripId, body) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/hotels', { ...path(tripId), body })),
  update: (tripId, id, body) =>
    unwrap(api.PATCH('/api/v1/trips/{tripId}/hotels/{id}', { ...pathWithId(tripId, id), body })),
  remove: async (tripId, id) => {
    await unwrap(api.DELETE('/api/v1/trips/{tripId}/hotels/{id}', pathWithId(tripId, id)));
  },
};

export const ticketsApi: ResourceApi<Ticket, TicketCreate, TicketPatch> = {
  list: async (tripId, signal) =>
    (await unwrap(api.GET('/api/v1/trips/{tripId}/tickets', { ...path(tripId), ...abort(signal) })))
      .items,
  create: (tripId, body) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/tickets', { ...path(tripId), body })),
  update: (tripId, id, body) =>
    unwrap(api.PATCH('/api/v1/trips/{tripId}/tickets/{id}', { ...pathWithId(tripId, id), body })),
  remove: async (tripId, id) => {
    await unwrap(api.DELETE('/api/v1/trips/{tripId}/tickets/{id}', pathWithId(tripId, id)));
  },
};
