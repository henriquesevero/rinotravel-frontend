import { useState } from 'react';
import { View } from 'react-native';

import type { PlaceCandidate } from '@/core/api';
import { hasCode } from '@/core/api';
import { useDebouncedValue } from '@/core/hooks/use-debounced-value';
import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { usePlaceSearch } from '@/features/places/hooks';
import { space } from '@/shared/theme';
import { Card, ListRow, Text, TextField } from '@/shared/ui';

interface PlaceSearchProps {
  onPick: (candidate: PlaceCandidate) => void;
  testID?: string;
}

/** Google-backed autocomplete. When the server has no key the endpoint does not exist and we say so. */
export function PlaceSearch({ onPick, testID }: PlaceSearchProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const query = useDebouncedValue(text);
  const search = usePlaceSearch(query);
  const describe = useDescribeError();
  // No key on the server, an outage and a spent monthly limit all mean "type it in yourself"; only the
  // last one is worth explaining, because it will not fix itself until next month.
  const note = !search.isError
    ? undefined
    : hasCode(search.error, 'provider_quota_exhausted')
      ? describe(search.error)
      : t('places.searchUnavailable');
  const results = search.data ?? [];

  return (
    <View style={{ gap: space.sm }}>
      <TextField
        testID={testID}
        label={t('places.search')}
        placeholder={t('places.searchPlaceholder')}
        hint={t('places.searchHint')}
        value={text}
        onChangeText={setText}
        autoCorrect={false}
      />
      {note ? (
        <Text variant="footnote" tone="secondary">
          {note}
        </Text>
      ) : null}
      {search.isSuccess && results.length === 0 ? (
        <Text variant="footnote" tone="secondary">
          {t('places.searchEmpty')}
        </Text>
      ) : null}
      {results.length > 0 ? (
        <Card padded={false}>
          {results.slice(0, 5).map((candidate, index) => (
            <ListRow
              key={candidate.providerId}
              divider={index > 0}
              icon="location-outline"
              title={candidate.name}
              {...(candidate.address ? { subtitle: candidate.address } : {})}
              onPress={() => {
                onPick(candidate);
                setText('');
              }}
            />
          ))}
        </Card>
      ) : null}
    </View>
  );
}
