import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ChecklistCategory, ChecklistItem, Trip } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { DetailSheet } from '@/features/content/DetailSheet';
import { TripPage } from '@/features/content/TripPage';
import { radius, space, useStyles, type Theme } from '@/shared/theme';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconBadge,
  IconButton,
  ListRow,
  Skeleton,
  Text,
} from '@/shared/ui';

import { ChecklistSheet } from './ChecklistSheet';
import { checklistHooks } from './hooks';

const CATEGORY_VISUAL: Record<
  ChecklistCategory,
  {
    icon:
      | 'document-text-outline'
      | 'shirt-outline'
      | 'phone-portrait-outline'
      | 'water-outline'
      | 'ellipsis-horizontal-circle-outline';
    tint: 'blue' | 'pink' | 'violet' | 'teal' | 'slate';
  }
> = {
  DOCUMENTS: { icon: 'document-text-outline', tint: 'blue' },
  CLOTHES: { icon: 'shirt-outline', tint: 'pink' },
  ELECTRONICS: { icon: 'phone-portrait-outline', tint: 'violet' },
  TOILETRIES: { icon: 'water-outline', tint: 'teal' },
  OTHER: { icon: 'ellipsis-horizontal-circle-outline', tint: 'slate' },
};

const CATEGORY_ORDER: ChecklistCategory[] = [
  'DOCUMENTS',
  'CLOTHES',
  'ELECTRONICS',
  'TOILETRIES',
  'OTHER',
];

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    group: { gap: space.sm },
    groupHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    groupTitle: { flex: 1, minWidth: 0 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    qty: {
      paddingHorizontal: space.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
    },
  });

export function ChecklistScreen({ tripId }: { tripId: string }) {
  const { t } = useTranslation();

  return (
    <TripPage tripId={tripId} title={t('checklist.title')}>
      {({ trip, canWrite }) => <Content trip={trip} canWrite={canWrite} />}
    </TripPage>
  );
}

function Content({ trip, canWrite }: { trip: Trip; canWrite: boolean }) {
  const { t } = useTranslation();
  const tripId = trip.id;
  const items = checklistHooks.useList(tripId);
  const update = checklistHooks.useUpdate(tripId);
  const [sheet, setSheet] = useState<{ item?: ChecklistItem } | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  if (items.error) {
    return (
      <ErrorState
        error={items.error}
        title={t('checklist.loadError')}
        onRetry={() => void items.refetch()}
      />
    );
  }
  if (!items.data) {
    return (
      <View style={{ gap: space.sm }}>
        <Skeleton height={72} borderRadius={16} />
        <Skeleton height={72} borderRadius={16} />
      </View>
    );
  }

  const all = items.data;
  const done = all.filter((item) => item.checked).length;
  const viewing = all.find((item) => item.id === viewId);
  const toggle = (item: ChecklistItem) => {
    void update.mutateAsync({
      id: item.id,
      baseVersion: item.version,
      patch: { checked: !item.checked },
    });
  };

  return (
    <>
      <View style={{ gap: space.lg }}>
        {canWrite ? (
          <View style={{ flexDirection: 'row' }}>
            <Button
              testID="add-checklist-item"
              title={t('checklist.add')}
              icon="add"
              size="sm"
              onPress={() => setSheet({})}
            />
          </View>
        ) : null}
        {all.length === 0 ? (
          <EmptyState
            icon="checkbox-outline"
            title={t('checklist.emptyTitle')}
            message={t('checklist.emptyMessage')}
            {...(canWrite ? { actionLabel: t('checklist.add'), onAction: () => setSheet({}) } : {})}
          />
        ) : (
          <>
            <Summary total={all.length} done={done} />
            {CATEGORY_ORDER.filter((category) =>
              all.some((item) => item.category === category),
            ).map((category) => (
              <Group
                key={category}
                category={category}
                items={all.filter((item) => item.category === category)}
                canWrite={canWrite}
                onToggle={toggle}
                onOpen={(item) => setViewId(item.id)}
              />
            ))}
          </>
        )}
      </View>
      <ChecklistDetail
        tripId={tripId}
        item={viewing}
        visible={viewId !== null}
        onClose={() => setViewId(null)}
        onEdit={
          canWrite
            ? () => {
                setViewId(null);
                setSheet({ item: viewing });
              }
            : undefined
        }
      />
      <ChecklistSheet
        tripId={tripId}
        visible={sheet !== null}
        onClose={() => setSheet(null)}
        item={sheet?.item}
      />
    </>
  );
}

function Summary({ total, done }: { total: number; done: number }) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);
  return (
    <Card testID="checklist-summary">
      <View style={styles.summary}>
        <Text variant="subhead" tone="secondary">
          {t('checklist.progress', { done, total })}
        </Text>
        <Badge label={`${done}/${total}`} tone={done === total ? 'success' : 'neutral'} />
      </View>
    </Card>
  );
}

function Group({
  category,
  items,
  canWrite,
  onToggle,
  onOpen,
}: {
  category: ChecklistCategory;
  items: ChecklistItem[];
  canWrite: boolean;
  onToggle: (item: ChecklistItem) => void;
  onOpen: (item: ChecklistItem) => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);
  const visual = CATEGORY_VISUAL[category];
  const sorted = [...items].sort(
    (a, b) => Number(a.checked) - Number(b.checked) || a.title.localeCompare(b.title),
  );
  return (
    <View style={styles.group} testID={`checklist-category-${category}`}>
      <View style={styles.groupHead}>
        <IconBadge icon={visual.icon} tint={visual.tint} />
        <View style={styles.groupTitle}>
          <Text variant="headline">{t(`enums.checklistCategory.${category}`)}</Text>
        </View>
      </View>
      <Card padded={false}>
        {sorted.map((item, index) => (
          <ListRow
            key={item.id}
            testID={`checklist-item-${item.id}`}
            divider={index > 0}
            title={item.title}
            tone={item.checked ? 'secondary' : 'primary'}
            subtitle={item.notes || undefined}
            right={
              <View style={styles.rowRight}>
                {item.quantity > 1 ? (
                  <View style={styles.qty}>
                    <Text variant="footnote" numeric>{`×${item.quantity}`}</Text>
                  </View>
                ) : null}
                {canWrite ? (
                  <IconButton
                    testID={`toggle-checklist-item-${item.id}`}
                    icon={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
                    tone={item.checked ? 'success' : 'secondary'}
                    label={item.checked ? t('checklist.markPending') : t('checklist.markPacked')}
                    onPress={() => onToggle(item)}
                  />
                ) : null}
              </View>
            }
            onPress={() => onOpen(item)}
          />
        ))}
      </Card>
    </View>
  );
}

function ChecklistDetail({
  tripId,
  item,
  visible,
  onClose,
  onEdit,
}: {
  tripId: string;
  item: ChecklistItem | undefined;
  visible: boolean;
  onClose: () => void;
  onEdit: (() => void) | undefined;
}) {
  const { t } = useTranslation();
  const visual = CATEGORY_VISUAL[item?.category ?? 'OTHER'];
  return (
    <DetailSheet
      tripId={tripId}
      visible={visible && item !== undefined}
      onClose={onClose}
      onEdit={onEdit}
      title={item?.title ?? ''}
      subtitle={item ? t(`enums.checklistCategory.${item.category}`) : undefined}
      icon={visual.icon}
      tint={visual.tint}
      badges={
        item
          ? [
              {
                label: item.checked ? t('checklist.packed') : t('checklist.pending'),
                tone: item.checked ? ('success' as const) : ('neutral' as const),
              },
            ]
          : []
      }
      rows={[{ label: t('checklist.quantity'), value: item ? String(item.quantity) : undefined }]}
      notes={item?.notes}
      testID="checklist-detail"
    />
  );
}
