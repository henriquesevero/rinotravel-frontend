import type { components } from './schema';

type Schemas = components['schemas'];

export type Role = Schemas['Role'];
export type AssignableRole = Schemas['AssignableRole'];
export type User = Schemas['User'];
export type Session = Schemas['Session'];
export type Trip = Schemas['Trip'];
export type TripCapabilities = Schemas['TripCapabilities'];
export type Member = Schemas['Member'];
export type CreateTripRequest = Schemas['CreateTripRequest'];
export type UpdateTripRequest = Schemas['UpdateTripRequest'];
