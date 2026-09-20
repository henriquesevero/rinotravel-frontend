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
  /** Server paths such as `start.dateTime` mapped to the form field that shows them. */
  aliases: Readonly<Record<string, FieldPath<T>>> = {},
): boolean {
  if (!isApiError(error)) return false;

  let applied = false;
  for (const item of error.fieldErrors) {
    const root = item.field.split(/[.[]/)[0] ?? item.field;
    const field =
      aliases[item.field] ??
      aliases[root] ??
      fields.find((name) => name === item.field || name === root);
    if (field) {
      setError(field, { message: item.message });
      applied = true;
    }
  }
  return applied;
}
