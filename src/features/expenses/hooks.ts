import { createResourceHooks } from '@/core/resource/hooks';

import { expensesApi, limitsApi } from './api';

export const expenseHooks = createResourceHooks('expenses', expensesApi);
export const limitHooks = createResourceHooks('budget-limits', limitsApi);
