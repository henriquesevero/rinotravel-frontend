import { api, unwrap } from '@/core/api';
import type {
  BudgetLimit,
  BudgetLimitCreate,
  BudgetLimitPatch,
  Expense,
  ExpenseCreate,
  ExpensePatch,
} from '@/core/api';
import type { ResourceApi } from '@/core/resource/hooks';

const path = (tripId: string) => ({ params: { path: { tripId } } });
const pathWithId = (tripId: string, id: string) => ({ params: { path: { tripId, id } } });
const abort = (signal?: AbortSignal) => (signal ? { signal } : {});

export const expensesApi: ResourceApi<Expense, ExpenseCreate, ExpensePatch> = {
  list: async (tripId, signal) =>
    (
      await unwrap(
        api.GET('/api/v1/trips/{tripId}/expenses', { ...path(tripId), ...abort(signal) }),
      )
    ).items,
  create: (tripId, body) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/expenses', { ...path(tripId), body })),
  update: (tripId, id, body) =>
    unwrap(api.PATCH('/api/v1/trips/{tripId}/expenses/{id}', { ...pathWithId(tripId, id), body })),
  remove: async (tripId, id) => {
    await unwrap(api.DELETE('/api/v1/trips/{tripId}/expenses/{id}', pathWithId(tripId, id)));
  },
};

export const limitsApi: ResourceApi<BudgetLimit, BudgetLimitCreate, BudgetLimitPatch> = {
  list: async (tripId, signal) =>
    (
      await unwrap(
        api.GET('/api/v1/trips/{tripId}/budget-limits', { ...path(tripId), ...abort(signal) }),
      )
    ).items,
  create: (tripId, body) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/budget-limits', { ...path(tripId), body })),
  update: (tripId, id, body) =>
    unwrap(
      api.PATCH('/api/v1/trips/{tripId}/budget-limits/{id}', { ...pathWithId(tripId, id), body }),
    ),
  remove: async (tripId, id) => {
    await unwrap(api.DELETE('/api/v1/trips/{tripId}/budget-limits/{id}', pathWithId(tripId, id)));
  },
};
