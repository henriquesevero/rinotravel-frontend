import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type FieldPath, type FieldValues, type Resolver } from 'react-hook-form';
import type { ZodType } from 'zod';

import { applyApiFieldErrors } from '@/core/forms/apply-api-errors';

interface Options<V extends FieldValues> {
  schema: ZodType<V, unknown>;
  /** Must be referentially stable (memoize it): a change resets the form, which is how edits load. */
  defaults: V;
  fields: readonly FieldPath<V>[];
  aliases?: Readonly<Record<string, FieldPath<V>>>;
  onClose: () => void;
}

/** Shared behavior of the create/edit sheets: validation, server field errors and reset on close. */
export function useEntityForm<V extends FieldValues>({
  schema,
  defaults,
  fields,
  aliases,
  onClose,
}: Options<V>) {
  // The resolver's input type is looser than V; the schema's output is exactly V.
  const form = useForm<V>({
    resolver: zodResolver(schema as never) as unknown as Resolver<V>,
    defaultValues: defaults as never,
    values: defaults,
  });
  const [error, setError] = useState<unknown>(undefined);

  const fail = (cause: unknown) => {
    setError(applyApiFieldErrors(cause, form.setError, fields, aliases) ? undefined : cause);
  };
  const close = () => {
    form.reset(defaults);
    setError(undefined);
    onClose();
  };

  return { form, error, fail, close, clearError: () => setError(undefined) };
}
