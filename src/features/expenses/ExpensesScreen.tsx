import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { BudgetLimit, Expense, ExpenseLink, Trip } from '@/core/api';
import { formatMoney } from '@/core/datetime/money';
import { currentLocale, useTranslation } from '@/core/i18n';
import { DetailSheet } from '@/features/content/DetailSheet';
import { TripPage } from '@/features/content/TripPage';
import { EXPENSE_VISUAL } from '@/features/content/visuals';
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
  SegmentedControl,
  Skeleton,
  Text,
} from '@/shared/ui';

import { BudgetBar } from './BudgetBar';
import { BudgetSheet } from './BudgetSheet';
import { ExpenseSheet } from './ExpenseSheet';
import { expenseHooks, limitHooks } from './hooks';
import { targetKey, useLinkTargets, type LinkTarget } from './link-targets';
import {
  amountOf,
  budgetLine,
  byCategory,
  CATEGORIES,
  groupByLink,
  limitsByCategory,
  totalsOf,
  type Totals,
} from './summary';

type ViewMode = 'category' | 'place' | 'list';
type Filter = 'all' | 'PLANNED' | 'PAID';

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    summary: { gap: space.lg },
    figures: { flexDirection: 'row', gap: space.xl, flexWrap: 'wrap' },
    figure: { gap: 2, minWidth: 110 },
    headRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: space.md,
    },
    group: { gap: space.sm },
    groupHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingHorizontal: space.xs,
    },
    groupTitle: { flex: 1, minWidth: 0 },
    chips: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
    chip: {
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
    },
    amount: { alignItems: 'flex-end', gap: 2 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  });

export function ExpensesScreen({ tripId }: { tripId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { link } = useLocalSearchParams<{ link?: string }>();
  const expenses = expenseHooks.useList(tripId);
  const limits = limitHooks.useList(tripId);
  const { byKey } = useLinkTargets(tripId);
  const update = expenseHooks.useUpdate(tripId);

  const [view, setView] = useState<ViewMode>('category');
  const [filter, setFilter] = useState<Filter>('all');
  const [sheet, setSheet] = useState<{ expense?: Expense | undefined; link?: ExpenseLink } | null>(
    null,
  );
  const [viewId, setViewId] = useState<string | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const viewing = expenses.data?.find((expense) => expense.id === viewId);

  // Coming from a place ("add a purchase here") opens the form with that place already chosen; the
  // address holds it until the form is closed.
  const [linkType, linkId] = (link ?? '').split(':');
  const fromLink: ExpenseLink | undefined =
    linkType && linkId ? { type: linkType as ExpenseLink['type'], id: linkId } : undefined;
  const openSheet = sheet ?? (fromLink ? { link: fromLink } : null);
  const closeSheet = () => {
    setSheet(null);
    if (link) router.setParams({ link: undefined });
  };

  const toggle = (expense: Expense) => {
    const paid = expense.status === 'PAID';
    update.mutate({
      id: expense.id,
      baseVersion: expense.version,
      patch: paid
        ? { status: 'PLANNED', actual: null }
        : { status: 'PAID', actual: expense.estimate ?? null },
    });
  };

  return (
    <TripPage
      tripId={tripId}
      title={t('expenses.title')}
      onRefresh={() => {
        void expenses.refetch();
        void limits.refetch();
      }}
      right={({ canWrite }) =>
        canWrite ? (
          <Button
            testID="add-expense"
            title={t('expenses.add')}
            icon="add"
            size="sm"
            onPress={() => setSheet({})}
          />
        ) : null
      }
    >
      {({ trip, canWrite }) => {
        const failed = expenses.error ?? limits.error;
        if (failed) {
          return (
            <ErrorState
              error={failed}
              title={t('expenses.loadError')}
              onRetry={() => void expenses.refetch()}
            />
          );
        }
        if (!expenses.data || !limits.data) {
          return (
            <View style={{ gap: space.sm }}>
              <Skeleton height={150} borderRadius={16} />
              <Skeleton height={72} borderRadius={16} />
            </View>
          );
        }
        const all = expenses.data;
        const limitMap = limitsByCategory(limits.data, trip.currency);
        const totals = totalsOf(all, trip.currency);
        const row: RowProps = {
          trip,
          byKey,
          canWrite,
          onOpen: (expense) => setViewId(expense.id),
          onToggle: toggle,
        };
        return (
          <>
            <Summary
              trip={trip}
              totals={totals}
              limit={limitMap.get('TOTAL')}
              canWrite={canWrite}
              onBudget={() => setBudgetOpen(true)}
            />
            {all.length === 0 ? (
              <EmptyState
                icon="wallet-outline"
                title={t('expenses.emptyTitle')}
                message={t('expenses.emptyMessage')}
                {...(canWrite
                  ? { actionLabel: t('expenses.add'), onAction: () => setSheet({}) }
                  : {})}
              />
            ) : (
              <>
                <SegmentedControl
                  testID="expense-views"
                  value={view}
                  onChange={setView}
                  segments={[
                    { value: 'category', label: t('expenses.viewCategory') },
                    { value: 'place', label: t('expenses.viewPlace') },
                    { value: 'list', label: t('expenses.viewList') },
                  ]}
                />
                {view === 'category' ? (
                  <CategoryView all={all} limits={limitMap} {...row} />
                ) : view === 'place' ? (
                  <PlaceView all={all} {...row} />
                ) : (
                  <ListView all={all} filter={filter} onFilter={setFilter} {...row} />
                )}
              </>
            )}
            <ExpenseDetail
              tripId={tripId}
              expense={viewing}
              targets={byKey}
              visible={viewId !== null}
              onClose={() => setViewId(null)}
              onEdit={
                canWrite
                  ? () => {
                      setViewId(null);
                      setSheet({ expense: viewing });
                    }
                  : undefined
              }
            />
            <ExpenseSheet
              tripId={tripId}
              visible={openSheet !== null}
              onClose={closeSheet}
              currency={trip.currency}
              expense={openSheet?.expense}
              defaultLink={openSheet?.link}
            />
            <BudgetSheet
              tripId={tripId}
              visible={budgetOpen}
              onClose={() => setBudgetOpen(false)}
              currency={trip.currency}
              limits={limits.data}
            />
          </>
        );
      }}
    </TripPage>
  );
}

function money(amount: number, trip: Trip) {
  return formatMoney(amount, trip.currency, currentLocale());
}

function Summary({
  trip,
  totals,
  limit,
  canWrite,
  onBudget,
}: {
  trip: Trip;
  totals: Totals;
  limit: BudgetLimit | undefined;
  canWrite: boolean;
  onBudget: () => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);
  const line = limit ? budgetLine(limit.amount.amount, totals) : null;
  return (
    <Card testID="expense-summary">
      <View style={styles.summary}>
        <View style={styles.headRow}>
          <View style={{ flex: 1, minWidth: 200, gap: 2 }}>
            <Text variant="caption" tone="secondary" style={{ letterSpacing: 0.8 }}>
              {t('expenses.forecast').toUpperCase()}
            </Text>
            <Text variant="title" heading numeric testID="expense-forecast">
              {money(totals.forecast, trip)}
              {limit ? (
                <Text tone="secondary" variant="callout">
                  {`  ${t('expenses.of', { value: money(limit.amount.amount, trip) })}`}
                </Text>
              ) : null}
            </Text>
          </View>
          {canWrite ? (
            <Button
              testID="edit-budget"
              title={limit ? t('expenses.editBudget') : t('expenses.setBudget')}
              variant="secondary"
              size="sm"
              icon="wallet-outline"
              onPress={onBudget}
            />
          ) : null}
        </View>
        {line ? <BudgetBar line={line} testID="expense-bar" /> : null}
        <View style={styles.figures}>
          <Figure
            label={t('expenses.spent')}
            value={money(totals.spent, trip)}
            testID="figure-spent"
          />
          <Figure
            label={t('expenses.planned')}
            value={money(totals.planned, trip)}
            testID="figure-planned"
          />
          {line ? (
            <Figure
              label={line.remaining < 0 ? t('expenses.stateOver') : t('expenses.remaining')}
              value={money(Math.abs(line.remaining), trip)}
              tone={
                line.state === 'over' ? 'danger' : line.state === 'close' ? 'warning' : 'success'
              }
              testID="figure-remaining"
            />
          ) : null}
        </View>
        {!limit ? (
          <Text variant="footnote" tone="secondary">
            {t('expenses.noBudgetMessage')}
          </Text>
        ) : null}
        {totals.foreign > 0 ? (
          <Text variant="footnote" tone="warning">
            {t(totals.foreign === 1 ? 'expenses.foreignOne' : 'expenses.foreignMany', {
              count: totals.foreign,
            })}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

function Figure({
  label,
  value,
  tone = 'primary',
  testID,
}: {
  label: string;
  value: string;
  tone?: 'primary' | 'danger' | 'warning' | 'success';
  testID?: string;
}) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.figure}>
      <Text variant="footnote" tone="secondary">
        {label}
      </Text>
      <Text variant="headline" tone={tone} numeric testID={testID}>
        {value}
      </Text>
    </View>
  );
}

interface RowProps {
  trip: Trip;
  byKey: Map<string, LinkTarget>;
  canWrite: boolean;
  onOpen: (expense: Expense) => void;
  onToggle: (expense: Expense) => void;
}

function ExpenseRow({
  expense,
  showPlace,
  divider,
  byKey,
  canWrite,
  onOpen,
  onToggle,
}: RowProps & { expense: Expense; showPlace: boolean; divider: boolean }) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);
  const visual = EXPENSE_VISUAL[expense.category];
  const value = amountOf(expense);
  const paid = expense.status === 'PAID';
  const place = expense.link ? byKey.get(targetKey(expense.link.type, expense.link.id)) : undefined;
  const subtitle = [
    t(`enums.expenseCategory.${expense.category}`),
    showPlace && expense.link ? (place?.name ?? t('expenses.linkGone')) : '',
    expense.date ?? '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <ListRow
      testID={`expense-${expense.id}`}
      divider={divider}
      icon={visual.icon}
      tint={visual.tint}
      title={expense.name}
      subtitle={subtitle}
      right={
        <View style={styles.rowRight}>
          <View style={styles.amount}>
            <Text numeric style={{ fontWeight: '600' }}>
              {value ? formatMoney(value.amount, value.currency, currentLocale()) : ''}
            </Text>
            <Badge
              label={t(`enums.expenseStatus.${expense.status}`)}
              tone={paid ? 'success' : 'neutral'}
            />
          </View>
          {canWrite ? (
            <IconButton
              testID={`toggle-expense-${expense.id}`}
              icon={paid ? 'checkmark-circle' : 'ellipse-outline'}
              tone={paid ? 'success' : 'secondary'}
              label={paid ? t('expenses.markPlanned') : t('expenses.markBought')}
              onPress={() => onToggle(expense)}
            />
          ) : null}
        </View>
      }
      onPress={() => onOpen(expense)}
    />
  );
}

function RowList({
  list,
  showPlace,
  row,
}: {
  list: Expense[];
  showPlace: boolean;
  row: RowProps;
}): ReactNode {
  return (
    <Card padded={false}>
      {list.map((expense, index) => (
        <ExpenseRow
          key={expense.id}
          expense={expense}
          showPlace={showPlace}
          divider={index > 0}
          {...row}
        />
      ))}
    </Card>
  );
}

function CategoryView({
  all,
  limits,
  ...row
}: RowProps & { all: Expense[]; limits: Map<string, BudgetLimit> }) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);
  const totals = byCategory(all, row.trip.currency);
  const shown = CATEGORIES.filter((category) => totals.has(category) || limits.has(category));
  return (
    <View style={{ gap: space.xl }}>
      {shown.map((category) => {
        const list = all.filter((expense) => expense.category === category);
        const sums = totals.get(category) ?? totalsOf([], row.trip.currency);
        const limit = limits.get(category);
        const line = limit ? budgetLine(limit.amount.amount, sums) : null;
        const visual = EXPENSE_VISUAL[category];
        return (
          <View key={category} style={styles.group} testID={`category-${category}`}>
            <View style={styles.groupHead}>
              <IconBadge icon={visual.icon} tint={visual.tint} />
              <View style={styles.groupTitle}>
                <Text variant="headline">{t(`enums.expenseCategory.${category}`)}</Text>
                <Text variant="footnote" tone="secondary" numeric>
                  {`${money(sums.spent, row.trip)} · ${t('expenses.planned')} ${money(sums.planned, row.trip)}`}
                  {limit
                    ? ` · ${t('expenses.of', { value: money(limit.amount.amount, row.trip) })}`
                    : ''}
                </Text>
              </View>
              {line && line.state !== 'ok' && line.state !== 'none' ? (
                <Badge
                  label={line.state === 'over' ? t('expenses.stateOver') : t('expenses.stateClose')}
                  tone={line.state === 'over' ? 'danger' : 'warning'}
                />
              ) : null}
            </View>
            {line ? <BudgetBar line={line} /> : null}
            {list.length > 0 ? <RowList list={list} showPlace row={row} /> : null}
          </View>
        );
      })}
    </View>
  );
}

function PlaceView({ all, ...row }: RowProps & { all: Expense[] }) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);
  const groups = [...groupByLink(all)].sort(([a], [b]) => {
    if (a === 'none') return 1;
    if (b === 'none') return -1;
    return (row.byKey.get(a)?.name ?? '~').localeCompare(row.byKey.get(b)?.name ?? '~');
  });
  return (
    <View style={{ gap: space.xl }}>
      {groups.map(([key, list]) => {
        const target = row.byKey.get(key);
        const sums = totalsOf(list, row.trip.currency);
        const title =
          key === 'none' ? t('expenses.unlinked') : (target?.name ?? t('expenses.linkGone'));
        return (
          <View key={key} style={styles.group} testID={`place-group-${key}`}>
            <View style={styles.groupHead}>
              <IconBadge
                icon={key === 'none' ? 'ellipsis-horizontal-circle-outline' : 'location-outline'}
                tint="violet"
              />
              <View style={styles.groupTitle}>
                <Text variant="headline">{title}</Text>
                <Text variant="footnote" tone="secondary" numeric>
                  {`${money(sums.spent, row.trip)} · ${t('expenses.planned')} ${money(sums.planned, row.trip)}`}
                </Text>
              </View>
              {target ? (
                <Badge label={t(`expenses.linkType.${target.type}`)} tone="neutral" />
              ) : null}
            </View>
            <RowList list={list} showPlace={false} row={row} />
          </View>
        );
      })}
    </View>
  );
}

function ListView({
  all,
  filter,
  onFilter,
  ...row
}: RowProps & { all: Expense[]; filter: Filter; onFilter: (filter: Filter) => void }) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);
  const shown = all
    .filter((expense) => filter === 'all' || expense.status === filter)
    // To buy first, then the most recent payments.
    .sort(
      (a, b) =>
        Number(a.status === 'PAID') - Number(b.status === 'PAID') ||
        (b.date ?? '').localeCompare(a.date ?? '') ||
        a.name.localeCompare(b.name),
    );
  const chips: { value: Filter; label: string }[] = [
    { value: 'all', label: t('expenses.filterAll') },
    { value: 'PLANNED', label: t('expenses.filterPlanned') },
    { value: 'PAID', label: t('expenses.filterPaid') },
  ];
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.chips}>
        {chips.map((chip) => (
          <Button
            key={chip.value}
            testID={`filter-${chip.value}`}
            title={chip.label}
            size="sm"
            variant={filter === chip.value ? 'secondary' : 'ghost'}
            onPress={() => onFilter(chip.value)}
          />
        ))}
      </View>
      <RowList list={shown} showPlace row={row} />
    </View>
  );
}

function ExpenseDetail({
  tripId,
  expense,
  targets,
  visible,
  onClose,
  onEdit,
}: {
  tripId: string;
  expense: Expense | undefined;
  targets: Map<string, LinkTarget>;
  visible: boolean;
  onClose: () => void;
  onEdit: (() => void) | undefined;
}) {
  const { t } = useTranslation();
  const locale = currentLocale();
  const visual = EXPENSE_VISUAL[expense?.category ?? 'OTHER'];
  const place = expense?.link
    ? targets.get(targetKey(expense.link.type, expense.link.id))
    : undefined;
  const fmt = (value: Expense['estimate']) =>
    value ? formatMoney(value.amount, value.currency, locale) : undefined;
  return (
    <DetailSheet
      tripId={tripId}
      visible={visible && expense !== undefined}
      onClose={onClose}
      onEdit={onEdit}
      title={expense?.name ?? ''}
      subtitle={expense ? t(`enums.expenseCategory.${expense.category}`) : undefined}
      icon={visual.icon}
      tint={visual.tint}
      badges={
        expense
          ? [
              {
                label: t(`enums.expenseStatus.${expense.status}`),
                tone: expense.status === 'PAID' ? ('success' as const) : ('neutral' as const),
              },
            ]
          : []
      }
      rows={[
        { label: t('expenses.estimate'), value: fmt(expense?.estimate) },
        { label: t('expenses.actual'), value: fmt(expense?.actual) },
        {
          label: t('expenses.where'),
          value: expense?.link ? (place?.name ?? t('expenses.linkGone')) : undefined,
        },
        { label: t('expenses.date'), value: expense?.date },
      ]}
      notes={expense?.notes}
      testID="expense-detail"
    />
  );
}
