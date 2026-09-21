import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { ExpenseLink } from '@/core/api';
import { formatMoney } from '@/core/datetime/money';
import { currentLocale, useTranslation } from '@/core/i18n';
import { space, useStyles, type Theme } from '@/shared/theme';
import { Badge, Button, Text } from '@/shared/ui';

import { expenseHooks } from './hooks';
import { amountOf, totalsOf } from './summary';

interface LinkedExpensesProps {
  tripId: string;
  currency: string;
  link: ExpenseLink;
  canWrite: boolean;
  /** Closes the sheet this sits in before leaving for the expenses. */
  onNavigate: () => void;
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    box: { gap: space.sm, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.border },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
    },
    name: { flex: 1, minWidth: 0 },
    right: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  });

/**
 * What is bought or spent at a place, on the place's own view: the list with what it adds up to, and
 * a way to add a purchase there. Adding goes to the expenses with the place already chosen.
 */
export function LinkedExpenses({
  tripId,
  currency,
  link,
  canWrite,
  onNavigate,
}: LinkedExpensesProps) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const expenses = expenseHooks.useList(tripId);
  const here = (expenses.data ?? []).filter(
    (expense) => expense.link?.type === link.type && expense.link.id === link.id,
  );
  const totals = totalsOf(here, currency);
  const locale = currentLocale();
  const go = (withLink: boolean) => {
    onNavigate();
    router.push({
      pathname: '/trips/[id]/expenses',
      params: { id: tripId, ...(withLink ? { link: `${link.type}:${link.id}` } : {}) },
    });
  };
  // Nothing to show and nothing to add: say nothing.
  if (expenses.data !== undefined && here.length === 0 && !canWrite) return null;

  return (
    <View style={styles.box} testID="linked-expenses">
      <Text variant="headline">{t('expenses.hereTitle')}</Text>
      {here.length === 0 ? (
        <Text tone="secondary" variant="footnote">
          {t('expenses.hereEmpty')}
        </Text>
      ) : (
        <>
          {here.map((expense) => {
            const value = amountOf(expense);
            return (
              <View key={expense.id} style={styles.row}>
                <Text style={styles.name} numberOfLines={1}>
                  {expense.name}
                </Text>
                <View style={styles.right}>
                  <Text numeric>
                    {value ? formatMoney(value.amount, value.currency, locale) : ''}
                  </Text>
                  <Badge
                    label={t(`enums.expenseStatus.${expense.status}`)}
                    tone={expense.status === 'PAID' ? 'success' : 'neutral'}
                  />
                </View>
              </View>
            );
          })}
          <View style={styles.row}>
            <Text variant="footnote" tone="secondary">
              {`${t('expenses.spent')} ${formatMoney(totals.spent, currency, locale)} · ${t('expenses.planned')} ${formatMoney(totals.planned, currency, locale)}`}
            </Text>
          </View>
        </>
      )}
      <View style={styles.buttons}>
        {canWrite ? (
          <Button
            testID="linked-expense-add"
            title={t('expenses.hereAdd')}
            icon="add"
            size="sm"
            onPress={() => go(true)}
          />
        ) : null}
        {here.length > 0 ? (
          <Button
            title={t('expenses.hereSeeAll')}
            variant="secondary"
            size="sm"
            onPress={() => go(false)}
          />
        ) : null}
      </View>
    </View>
  );
}
