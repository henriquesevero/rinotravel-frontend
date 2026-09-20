import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Card, ListRow, Sheet } from '@/shared/ui';

import type { NavItem, NavState } from './nav';

interface MoreSheetProps {
  visible: boolean;
  onClose: () => void;
  nav: NavState;
  overflow: NavItem[];
  onOpenAccount: () => void;
}

/** The phone's overflow menu: the trip sections that do not fit the tab bar, plus global shortcuts. */
export function MoreSheet({ visible, onClose, nav, overflow, onOpenAccount }: MoreSheetProps) {
  const { t } = useTranslation();
  const go = (item: NavItem) => {
    onClose();
    nav.go(item.href);
  };
  const all = nav.main.filter((item) => item.key === 'trips' || item.key === 'new');

  return (
    <Sheet visible={visible} onClose={onClose} title={t('navMore.title')}>
      <View style={{ gap: 16 }}>
        <Card padded={false}>
          {overflow.map((item, index) => (
            <ListRow
              key={item.key}
              testID={`more-${item.key}`}
              divider={index > 0}
              icon={item.active ? item.activeIcon : item.icon}
              title={t(item.labelKey)}
              onPress={() => go(item)}
            />
          ))}
        </Card>
        <Card padded={false}>
          {all.map((item, index) => (
            <ListRow
              key={item.key}
              testID={`more-${item.key}`}
              divider={index > 0}
              icon={item.icon}
              title={item.key === 'trips' ? t('navMore.allTrips') : t(item.labelKey)}
              onPress={() => go(item)}
            />
          ))}
          <ListRow
            divider
            testID="more-account"
            icon="person-circle-outline"
            title={t('nav.account')}
            onPress={() => {
              onClose();
              onOpenAccount();
            }}
          />
        </Card>
      </View>
    </Sheet>
  );
}
