import { useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { Card, ListRow, Sheet, Text, TextField, type IconName } from '@/shared/ui';

import type { LinkTarget, LinkType } from './link-targets';

const ICON: Record<LinkType, IconName> = {
  place: 'location-outline',
  restaurant: 'restaurant-outline',
  itinerary_item: 'calendar-outline',
  ticket: 'ticket-outline',
  hotel: 'bed-outline',
  flight: 'airplane-outline',
  transfer: 'swap-horizontal-outline',
};

interface LinkPickerProps {
  visible: boolean;
  onClose: () => void;
  targets: LinkTarget[];
  selected: string | null;
  onPick: (target: LinkTarget) => void;
}

/** The places of the trip a purchase can be tied to, searchable, with what kind of thing each is. */
export function LinkPicker({ visible, onClose, targets, selected, onPick }: LinkPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? targets.filter((target) => target.name.toLowerCase().includes(needle))
    : targets;

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={close} title={t('expenses.linkTitle')}>
      {targets.length === 0 ? (
        <Text tone="secondary" testID="link-empty">
          {t('expenses.linkEmpty')}
        </Text>
      ) : (
        <>
          <TextField
            testID="link-search"
            label={t('common.search')}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Card padded={false}>
            {shown.map((target, index) => (
              <ListRow
                key={target.key}
                testID={`link-${target.key}`}
                divider={index > 0}
                icon={target.key === selected ? 'checkmark-circle' : ICON[target.type]}
                title={target.name}
                subtitle={t(`expenses.linkType.${target.type}`)}
                onPress={() => {
                  onPick(target);
                  close();
                }}
              />
            ))}
          </Card>
        </>
      )}
    </Sheet>
  );
}
