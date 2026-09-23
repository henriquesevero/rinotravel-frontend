import type {
  Flight,
  Hotel,
  ItineraryDay,
  ItineraryItem,
  Restaurant,
  Ticket,
  Transfer,
} from '@/core/api';

import { deriveLines, isAuto, type MoneySources } from './derived';
import { totalsOf } from './summary';

const base = {
  tripId: 't',
  version: 1,
  createdAt: '2027-01-01T00:00:00Z',
  updatedAt: '2027-01-01T00:00:00Z',
};
const usd = (amount: number) => ({ amount, currency: 'USD' });
const at = (dateTime: string) => ({ dateTime, timezone: 'America/New_York' });
// 2027-04-03 12:00 in New York.
const NOW = Date.parse('2027-04-03T16:00:00Z');

const sources = (over: Partial<MoneySources>): MoneySources => ({
  today: '2027-04-03',
  now: NOW,
  days: [],
  items: [],
  restaurants: [],
  tickets: [],
  transfers: [],
  flights: [],
  hotels: [],
  payments: [],
  ...over,
});

const day = (id: string, date: string): ItineraryDay => ({ ...base, id, date });

describe('deriveLines', () => {
  it('brings the price of a ticket, a meal and a fare, each in its own category', () => {
    const lines = deriveLines(
      sources({
        days: [day('d1', '2027-04-05')],
        items: [
          {
            ...base,
            id: 'i1',
            dayId: 'd1',
            title: 'Jantar no Katz',
            category: 'RESTAURANT',
            status: 'PLANNED',
            estimatedCost: usd(4500),
          } as ItineraryItem,
        ],
        tickets: [
          {
            ...base,
            id: 'k1',
            name: 'Hamilton',
            kind: 'SHOW',
            quantity: 2,
            status: 'PLANNED',
            cost: usd(30000),
            start: at('2027-04-06T19:00:00'),
          } as Ticket,
        ],
        transfers: [
          {
            ...base,
            id: 'x1',
            status: 'PLANNED',
            legs: [],
            origin: { name: 'JFK' },
            destination: { name: 'Grand Central' },
            totalCost: usd(290),
            departure: at('2027-04-05T08:00:00'),
          } as Transfer,
        ],
      }),
    );
    expect(lines.map((l) => [l.name, l.category, l.status, l.estimate?.amount])).toEqual([
      ['Jantar no Katz', 'FOOD', 'PLANNED', 4500],
      ['Hamilton', 'ACTIVITIES', 'PLANNED', 30000],
      ['JFK → Grand Central', 'TRANSPORT', 'PLANNED', 290],
    ]);
    expect(lines.every(isAuto)).toBe(true);
    expect(lines[0]?.link).toEqual({ type: 'itinerary_item', id: 'i1' });
    expect(totalsOf(lines, 'USD').planned).toBe(34790);
  });

  it('counts something that has happened, or was ticked off, as spent', () => {
    const lines = deriveLines(
      sources({
        days: [day('d0', '2027-04-01'), day('d1', '2027-04-09')],
        items: [
          // On a day already gone, with no time: spent.
          {
            ...base,
            id: 'a',
            dayId: 'd0',
            title: 'Museu',
            category: 'ATTRACTION',
            status: 'PLANNED',
            estimatedCost: usd(2500),
          },
          // On a future day but marked done: spent.
          {
            ...base,
            id: 'b',
            dayId: 'd1',
            title: 'Passeio',
            category: 'ATTRACTION',
            status: 'COMPLETED',
            estimatedCost: usd(1000),
          },
          // On a future day, not done: still to spend.
          {
            ...base,
            id: 'c',
            dayId: 'd1',
            title: 'Show',
            category: 'ATTRACTION',
            status: 'CONFIRMED',
            estimatedCost: usd(8000),
          },
        ] as ItineraryItem[],
        flights: [
          {
            ...base,
            id: 'f',
            flightNumber: 'LA8180',
            departureAirport: 'GRU',
            arrivalAirport: 'JFK',
            departure: at('2027-04-01T22:00:00'),
            arrival: at('2027-04-02T06:00:00'),
            cost: usd(90000),
          } as Flight,
        ],
      }),
    );
    const by = Object.fromEntries(lines.map((l) => [l.name, l]));
    expect(by['Museu']?.status).toBe('PAID');
    expect(by['Museu']?.actual?.amount).toBe(2500);
    expect(by['Passeio']?.status).toBe('PAID');
    expect(by['Show']?.status).toBe('PLANNED');
    expect(by['Show']?.actual).toBeUndefined();
    expect(by['LA8180 GRU → JFK']?.status).toBe('PAID');
  });

  it('leaves out what has no price, what was skipped and wishlist restaurants', () => {
    const lines = deriveLines(
      sources({
        days: [day('d1', '2027-04-09')],
        items: [
          {
            ...base,
            id: 'a',
            dayId: 'd1',
            title: 'Passeio grátis',
            category: 'ATTRACTION',
            status: 'PLANNED',
          },
          {
            ...base,
            id: 'b',
            dayId: 'd1',
            title: 'Cancelado',
            category: 'ATTRACTION',
            status: 'SKIPPED',
            estimatedCost: usd(5000),
          },
        ] as ItineraryItem[],
        restaurants: [
          {
            ...base,
            id: 'r1',
            name: 'Quero ir',
            status: 'WISHLIST',
            desiredDishes: [],
            estimatedCost: usd(6000),
          },
          {
            ...base,
            id: 'r2',
            name: 'Reservado',
            status: 'RESERVED',
            desiredDishes: [],
            estimatedCost: usd(7000),
            reservationAt: at('2027-04-08T20:00:00'),
          },
          {
            ...base,
            id: 'r3',
            name: 'Já fui',
            status: 'VISITED',
            desiredDishes: [],
            estimatedCost: usd(3000),
          },
        ] as Restaurant[],
      }),
    );
    expect(lines.map((l) => [l.name, l.status])).toEqual([
      ['Reservado', 'PLANNED'],
      ['Já fui', 'PAID'],
    ]);
  });

  it('counts a hotel stay by its check-in and keeps other currencies for the totals to set aside', () => {
    const lines = deriveLines(
      sources({
        hotels: [
          {
            ...base,
            id: 'h',
            name: 'Park Hyatt',
            checkIn: at('2027-04-10T15:00:00'),
            checkOut: at('2027-04-13T11:00:00'),
            cost: { amount: 180000, currency: 'BRL' },
          } as Hotel,
        ],
      }),
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ category: 'LODGING', status: 'PLANNED', date: '2027-04-10' });
    expect(totalsOf(lines, 'USD')).toMatchObject({ forecast: 0, foreign: 1 });
  });

  it('lets the person say a price is paid before its date, or not paid after it', () => {
    const hotel = {
      ...base,
      id: 'h',
      name: 'Park Hyatt',
      checkIn: at('2027-04-10T15:00:00'),
      checkOut: at('2027-04-13T11:00:00'),
      cost: usd(180000),
    } as Hotel;
    const past = {
      ...hotel,
      id: 'g',
      name: 'Já hospedado',
      checkIn: at('2027-04-01T15:00:00'),
    } as Hotel;
    const mark = (id: string, paid: boolean) => ({
      ...base,
      id: `m-${id}`,
      link: { type: 'hotel' as const, id },
      paid,
    });
    const lines = deriveLines(
      sources({ hotels: [hotel, past], payments: [mark('h', true), mark('g', false)] }),
    );
    const by = Object.fromEntries(lines.map((l) => [l.name, l]));
    // Paid in advance, though the stay is still ahead.
    expect(by['Park Hyatt']?.status).toBe('PAID');
    expect(by['Park Hyatt']?.actual?.amount).toBe(180000);
    expect(by['Park Hyatt']?.auto).toMatchObject({ paidByDefault: false, mark: { paid: true } });
    // Not paid yet, though the date has gone by.
    expect(by['Já hospedado']?.status).toBe('PLANNED');
    expect(by['Já hospedado']?.auto.paidByDefault).toBe(true);
  });
});
