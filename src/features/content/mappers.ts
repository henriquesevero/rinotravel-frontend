import type { Location, Money } from '@/core/api';
import { minorToInput, parseMoneyInput } from '@/core/datetime/money';

/** An empty name and address means "no location", which the API expects as null on updates. */
export function toLocationInput(name: string, address: string): Location | null {
  const cleanName = name.trim();
  const cleanAddress = address.trim();
  if (cleanName === '' && cleanAddress === '') return null;
  return {
    ...(cleanName ? { name: cleanName } : {}),
    ...(cleanAddress ? { address: cleanAddress } : {}),
  };
}

/** Keeps coordinates a search result brought along when the person edits only the text. */
export function mergeLocation(
  name: string,
  address: string,
  previous: Location | null | undefined,
): Location | null {
  const next = toLocationInput(name, address);
  if (!next) return null;
  const keepsCoordinates =
    previous?.latitude !== undefined &&
    previous.longitude !== undefined &&
    previous.name === next.name &&
    previous.address === next.address;
  return keepsCoordinates
    ? { ...next, latitude: previous.latitude, longitude: previous.longitude }
    : next;
}

export function toMoneyInput(text: string, currency: string): Money | null {
  const amount = parseMoneyInput(text, currency);
  return amount === null ? null : { amount, currency };
}

export function fromMoney(money: Money | undefined): string {
  return money ? minorToInput(money.amount, money.currency) : '';
}

export function toOptionalInt(text: string): number | null {
  const clean = text.trim();
  return clean === '' ? null : Number(clean);
}

export function fromOptionalInt(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

export function splitList(text: string): string[] {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}
