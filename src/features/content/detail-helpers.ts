import type { Money, PlanStatus } from '@/core/api';
import { formatMoney } from '@/core/datetime/money';
import type { BadgeTone } from '@/shared/ui';

export function moneyText(money: Money | undefined, fallbackCurrency: string, locale: string) {
  return money ? formatMoney(money.amount, money.currency || fallbackCurrency, locale) : undefined;
}

export function statusTone(status: PlanStatus): BadgeTone {
  if (status === 'CONFIRMED' || status === 'COMPLETED') return 'success';
  return status === 'SKIPPED' ? 'neutral' : 'accent';
}
