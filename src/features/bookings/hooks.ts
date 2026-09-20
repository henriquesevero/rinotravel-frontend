import { createResourceHooks } from '@/core/resource/hooks';

import { flightsApi, hotelsApi } from './api';

export const flightHooks = createResourceHooks('flights', flightsApi);
export const hotelHooks = createResourceHooks('hotels', hotelsApi);
