import type { ItineraryItem } from '@/core/api';
import { formatDuration, formatDayShort, zonedTime } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { DetailSheet } from '@/features/content/DetailSheet';
import { moneyText, statusTone } from '@/features/content/detail-helpers';
import { CATEGORY_VISUAL } from '@/features/content/visuals';
import { LinkedExpenses } from '@/features/expenses/LinkedExpenses';

interface ItemDetailSheetProps {
  tripId: string;
  item: ItineraryItem | undefined;
  /** The civil date of the item's day. */
  date: string | undefined;
  currency: string;
  visible: boolean;
  onClose: () => void;
  onEdit?: (() => void) | undefined;
}

export function ItemDetailSheet({
  tripId,
  item,
  date,
  currency,
  visible,
  onClose,
  onEdit,
}: ItemDetailSheetProps) {
  const { t } = useTranslation();
  const locale = currentLocale();
  const visual = CATEGORY_VISUAL[item?.category ?? 'OTHER'];
  const times = [item?.start && zonedTime(item.start), item?.end && zonedTime(item.end)]
    .filter(Boolean)
    .join(' – ');

  return (
    <DetailSheet
      tripId={tripId}
      visible={visible && item !== undefined}
      onClose={onClose}
      title={item?.title ?? ''}
      subtitle={[date ? formatDayShort(date, locale) : '', times].filter(Boolean).join(' · ')}
      icon={visual.icon}
      tint={visual.tint}
      badges={
        item
          ? [
              { label: t(`enums.category.${item.category}`) },
              { label: t(`enums.status.${item.status}`), tone: statusTone(item.status) },
            ]
          : []
      }
      rows={[
        { label: t('detail.location'), value: item?.location?.name },
        { label: t('detail.address'), value: item?.location?.address },
        {
          label: t('detail.duration'),
          value: item?.durationMinutes ? formatDuration(item.durationMinutes) : undefined,
        },
        { label: t('detail.cost'), value: moneyText(item?.estimatedCost, currency, locale) },
        { label: t('detail.description'), value: item?.description },
      ]}
      notes={item?.notes}
      location={item?.location}
      actions={
        item ? (
          <LinkedExpenses
            tripId={tripId}
            currency={currency}
            link={{ type: 'itinerary_item', id: item.id }}
            canWrite={onEdit !== undefined}
            onNavigate={onClose}
          />
        ) : undefined
      }
      onEdit={onEdit}
      testID="item-detail"
    />
  );
}
