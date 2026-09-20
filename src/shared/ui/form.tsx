import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { useTranslation } from '@/core/i18n';

import { DateField } from './DateField';
import { SelectField, type SelectOption } from './SelectField';
import { TextField, type TextFieldProps } from './TextField';
import { TimeField } from './TimeField';

/** Zod schemas emit i18n keys (`validation.*`); server field errors arrive as plain text. */
export function useFieldMessage() {
  const { t } = useTranslation();
  return (message: string | undefined): string | undefined => {
    if (!message) return undefined;
    return message.startsWith('validation.') ? t(message as 'validation.required') : message;
  };
}

interface BaseProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
}

type FormTextFieldProps<T extends FieldValues> = BaseProps<T> &
  Omit<TextFieldProps, 'label' | 'value' | 'onChangeText' | 'onBlur' | 'error'>;

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  ...rest
}: FormTextFieldProps<T>) {
  const message = useFieldMessage();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          label={label}
          value={(field.value as string | undefined) ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={message(fieldState.error?.message)}
          {...rest}
        />
      )}
    />
  );
}

export function FormSelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  title,
  hint,
  searchable,
  testID,
}: BaseProps<T> & {
  options: SelectOption[];
  title: string;
  hint?: string;
  searchable?: boolean;
  testID?: string;
}) {
  const message = useFieldMessage();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <SelectField
          testID={testID}
          label={label}
          title={title}
          options={options}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          error={message(fieldState.error?.message)}
          {...(hint ? { hint } : {})}
          {...(searchable ? { searchable } : {})}
        />
      )}
    />
  );
}

export function FormDateField<T extends FieldValues>({
  control,
  name,
  label,
  testID,
}: BaseProps<T> & { testID?: string }) {
  const message = useFieldMessage();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DateField
          testID={testID}
          label={label}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          error={message(fieldState.error?.message)}
        />
      )}
    />
  );
}

export function FormTimeField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  testID,
}: BaseProps<T> & { hint?: string; testID?: string }) {
  const message = useFieldMessage();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TimeField
          testID={testID}
          label={label}
          value={(field.value as string | undefined) ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={message(fieldState.error?.message)}
          {...(hint ? { hint } : {})}
        />
      )}
    />
  );
}
