import { TextField, type TextFieldProps } from './TextField';

/** Keeps only digits and inserts the colon: `0930` becomes `09:30`. */
export function maskTime(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

type TimeFieldProps = Omit<TextFieldProps, 'onChangeText' | 'keyboardType' | 'maxLength'> & {
  onChangeText: (value: string) => void;
};

export function TimeField({ onChangeText, placeholder = '09:30', ...rest }: TimeFieldProps) {
  return (
    <TextField
      {...rest}
      placeholder={placeholder}
      keyboardType="number-pad"
      maxLength={5}
      autoCorrect={false}
      onChangeText={(text) => onChangeText(maskTime(text))}
    />
  );
}
