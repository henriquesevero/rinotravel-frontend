import { createResourceHooks } from '@/core/resource/hooks';

import { checklistApi } from './api';

export const checklistHooks = createResourceHooks('checklist_items', checklistApi);
