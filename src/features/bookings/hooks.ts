import { createResourceHooks } from '@/core/resource/hooks';

import { flightsApi, hotelsApi, ticketsApi } from './api';

export const flightHooks = createResourceHooks('flights', flightsApi);
export const hotelHooks = createResourceHooks('hotels', hotelsApi);
export const ticketHooks = createResourceHooks('tickets', ticketsApi);
