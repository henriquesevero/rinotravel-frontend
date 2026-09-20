import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';

import { isApiError } from '../api';

/**
 * Copies the API's per-field validation errors onto the matching form fields.
 * Returns true when at least one was applied, so the caller can skip the generic banner.
 */
export function applyApiFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly FieldPath<T>[],
): boolean {
  if (!isApiError(error)) return false;

  let applied = false;
  for (const item of error.fieldErrors) {
    const field = fields.find((name) => name === item.field);
    if (field) {
      setError(field, { message: item.message });
      applied = true;
    }
  }
  return applied;
}
