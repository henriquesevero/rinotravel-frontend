import type { Expense, Trip } from '@/core/api';
import { todayIn } from '@/core/datetime/civil-date';
import { flightHooks, hotelHooks, ticketHooks } from '@/features/bookings/hooks';
import { dayHooks, itemHooks } from '@/features/itinerary/hooks';
import { restaurantHooks } from '@/features/places/hooks';
import { transferHooks } from '@/features/transfers/hooks';

import { deriveLines } from './derived';
import { expenseHooks, paymentHooks } from './hooks';

/**
 * Every line of the trip's money: what was typed into the expenses plus what the trip's own records
 * bring (tickets, meals and things of the itinerary, transfers, flights, stays). One place builds it,
 * so the expenses, the overview and the budget always agree.
 */
export function useTripMoney(trip: Trip) {
  const id = trip.id;
  const expenses = expenseHooks.useList(id);
  const days = dayHooks.useList(id);
  const items = itemHooks.useList(id);
  const restaurants = restaurantHooks.useList(id);
  const tickets = ticketHooks.useList(id);
  const transfers = transferHooks.useList(id);
  const flights = flightHooks.useList(id);
  const hotels = hotelHooks.useList(id);
  const payments = paymentHooks.useList(id);

  const queries = [
    expenses,
    days,
    items,
    restaurants,
    tickets,
    transfers,
    flights,
    hotels,
    payments,
  ];
  const error = queries.find((query) => query.error)?.error;
  const ready =
    expenses.data &&
    days.data &&
    items.data &&
    restaurants.data &&
    tickets.data &&
    transfers.data &&
    flights.data &&
    hotels.data &&
    payments.data;

  const lines: Expense[] | undefined = ready
    ? [
        ...expenses.data,
        ...deriveLines({
          today: todayIn(trip.timezone),
          days: days.data,
          items: items.data,
          restaurants: restaurants.data,
          tickets: tickets.data,
          transfers: transfers.data,
          flights: flights.data,
          hotels: hotels.data,
          payments: payments.data,
        }),
      ]
    : undefined;

  return {
    lines,
    /** Only what was typed into the expenses, the part that can be edited here. */
    manual: expenses.data,
    error,
    refetch: () => {
      for (const query of queries) void query.refetch();
    },
  };
}
