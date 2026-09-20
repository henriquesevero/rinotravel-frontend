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

export type ZonedTime = Schemas['ZonedTime'];
export type Location = Schemas['Location'];
export type Money = Schemas['Money'];
export type PlanStatus = Schemas['PlanStatus'];

export type ItineraryDay = Schemas['ItineraryDay'];
export type ItineraryDayCreate = Schemas['ItineraryDayCreate'];
export type ItineraryDayPatch = Schemas['ItineraryDayPatch'];
export type ItineraryItem = Schemas['ItineraryItem'];
export type ItineraryItemCreate = Schemas['ItineraryItemCreate'];
export type ItineraryItemPatch = Schemas['ItineraryItemPatch'];
export type ItineraryCategory = Schemas['ItineraryCategory'];
export type Itinerary = Schemas['Itinerary'];
export type ScheduleFromPlaceRequest = Schemas['ScheduleFromPlaceRequest'];
export type TimelineEntry = Schemas['TimelineEntry'];

export type Place = Schemas['Place'];
export type PlaceCreate = Schemas['PlaceCreate'];
export type PlacePatch = Schemas['PlacePatch'];
export type PlaceCategory = Schemas['PlaceCategory'];
export type Priority = Schemas['Priority'];
export type PlaceCandidate = Schemas['PlaceCandidate'];
export type Restaurant = Schemas['Restaurant'];
export type RestaurantCreate = Schemas['RestaurantCreate'];
export type RestaurantPatch = Schemas['RestaurantPatch'];
export type RestaurantStatus = Schemas['RestaurantStatus'];

export type Flight = Schemas['Flight'];
export type FlightCreate = Schemas['FlightCreate'];
export type FlightPatch = Schemas['FlightPatch'];
export type Hotel = Schemas['Hotel'];
export type HotelCreate = Schemas['HotelCreate'];
export type HotelPatch = Schemas['HotelPatch'];

export type Transfer = Schemas['Transfer'];
export type TransferCreate = Schemas['TransferCreate'];
export type TransferPatch = Schemas['TransferPatch'];
export type TransferLeg = Schemas['TransferLeg'];
export type TransferLegInput = Schemas['TransferLegInput'];
export type TransferMode = Schemas['TransferMode'];
export type PlanTransferRequest = Schemas['PlanTransferRequest'];
export type RouteOption = Schemas['RouteOption'];

export type Document = Schemas['Document'];
export type DocumentType = Schemas['DocumentType'];
export type DocumentVisibility = Schemas['DocumentVisibility'];
export type DocumentPatch = Schemas['DocumentPatch'];
export type InitDocumentRequest = Schemas['InitDocumentRequest'];
export type SignedRequest = Schemas['SignedRequest'];
