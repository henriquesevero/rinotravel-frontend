import type { CivilDate } from '@/core/datetime/civil-date';

export interface DateFieldProps {
  label: string;
  /** `YYYY-MM-DD`, or an empty string when nothing is chosen yet. */
  value: CivilDate | '';
  onChange: (value: CivilDate) => void;
  error?: string | undefined;
  testID?: string | undefined;
}
