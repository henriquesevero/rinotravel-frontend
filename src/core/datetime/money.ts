function fractionDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/** The API stores money in the currency's minor unit (cents, or whole yen). */
export function formatMoney(amount: number, currency: string, locale: string): string {
  const digits = fractionDigits(currency);
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
      amount / 10 ** digits,
    );
  } catch {
    return `${(amount / 10 ** digits).toFixed(digits)} ${currency}`;
  }
}

/** Parses what a person types (`1.234,50`, `1234.5`, `80`) into the minor unit, or null if invalid. */
export function parseMoneyInput(text: string, currency: string): number | null {
  const digits = fractionDigits(currency);
  const clean = text.trim().replace(/\s/g, '');
  if (!/^\d[\d.,]*$/.test(clean)) return null;

  let whole = clean;
  let fraction = '';
  const lastSeparator = Math.max(clean.lastIndexOf('.'), clean.lastIndexOf(','));
  if (lastSeparator >= 0) {
    const after = clean.slice(lastSeparator + 1);
    const separators = (clean.match(/[.,]/g) ?? []).length;
    const mixed = clean.includes('.') && clean.includes(',');
    // "1.234" is a thousands group; "1,5" and "1.234,5" have a decimal part.
    if (after.length > 0 && after.length <= digits && (mixed || separators === 1)) {
      whole = clean.slice(0, lastSeparator);
      fraction = after;
    }
  }
  whole = whole.replace(/[.,]/g, '');
  if (whole === '') return null;
  const value = Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, '0') || 0);
  return Number.isSafeInteger(value) ? value : null;
}

/** For pre-filling an edit form. */
export function minorToInput(amount: number, currency: string): string {
  const digits = fractionDigits(currency);
  return digits === 0 ? String(amount) : (amount / 10 ** digits).toFixed(digits).replace('.', ',');
}

export function sumMoney(
  values: ({ amount: number; currency: string } | null | undefined)[],
  currency: string,
): number {
  return values.reduce(
    (total, money) => (money?.currency === currency ? total + money.amount : total),
    0,
  );
}
