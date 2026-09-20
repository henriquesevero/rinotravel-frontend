import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { View } from 'react-native';

import type { PlaceCandidate } from '@/core/api';
import { useDebouncedValue } from '@/core/hooks/use-debounced-value';
import { useTranslation } from '@/core/i18n';
import { usePlaceSearch } from '@/features/places/hooks';
import { space } from '@/shared/theme';
import { Card, ListRow, TextField, useFieldMessage } from '@/shared/ui';

interface PlaceInputProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  /** The suggestion currently chosen for this field, if any. */
  pick: PlaceCandidate | null;
  onPick: (candidate: PlaceCandidate | null) => void;
  testID?: string;
}

/**
 * A text field that suggests places from Google as you type. Choosing one fills the field and keeps
 * the place's address and coordinates, so the route and the map are exact; typing over it goes back
 * to plain text. Without a Google key on the server it is just a text field.
 */
export function PlaceInput<T extends FieldValues>({
  control,
  name,
  label,
  pick,
  onPick,
  testID,
}: PlaceInputProps<T>) {
  const { t } = useTranslation();
  const message = useFieldMessage();
  const { field, fieldState } = useController({ control, name });
  const value = String(field.value ?? '');
  const query = useDebouncedValue(value);
  const suggesting = value.trim().length >= 3 && value !== (pick?.name ?? '');
  const search = usePlaceSearch(suggesting ? query : '');
  const suggestions = suggesting ? (search.data ?? []).slice(0, 5) : [];

  return (
    <View style={{ gap: space.sm }}>
      <TextField
        {...(testID ? { testID } : {})}
        label={label}
        value={value}
        onChangeText={(text) => {
          field.onChange(text);
          if (pick && text !== pick.name) onPick(null);
        }}
        onBlur={field.onBlur}
        error={message(fieldState.error?.message)}
        autoCorrect={false}
        {...(pick?.address ? { hint: t('places.pickedHint', { address: pick.address }) } : {})}
      />
      {suggestions.length > 0 ? (
        <Card padded={false} testID={testID ? `${testID}-suggestions` : undefined}>
          {suggestions.map((candidate, index) => (
            <ListRow
              key={candidate.providerId}
              testID={testID ? `${testID}-suggestion-${index}` : undefined}
              divider={index > 0}
              icon="location-outline"
              tint="violet"
              title={candidate.name}
              {...(candidate.address ? { subtitle: candidate.address } : {})}
              onPress={() => {
                field.onChange(candidate.name);
                onPick(candidate);
              }}
            />
          ))}
        </Card>
      ) : null}
    </View>
  );
}
