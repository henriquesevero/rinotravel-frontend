import { getLocales } from 'expo-localization';

import type { SelectOption } from '@/shared/ui';

import { ptBR } from '@/core/i18n/locales/pt-BR';

/** Common destinations. Any IANA zone the API accepts is valid, but a pick-list beats free text. */
export const TIMEZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Fortaleza',
  'America/Argentina/Buenos_Aires',
  'America/Santiago',
  'America/Bogota',
  'America/Lima',
  'America/Montevideo',
  'America/Asuncion',
  'America/Mexico_City',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'Pacific/Honolulu',
  'Atlantic/Reykjavik',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/Zurich',
  'Europe/Rome',
  'Europe/Vienna',
  'Europe/Prague',
  'Europe/Athens',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Africa/Casablanca',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Jerusalem',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'UTC',
] as const;

export const CURRENCY_CODES = Object.keys(ptBR.currencies) as (keyof typeof ptBR.currencies)[];

export function timezoneOptions(extra?: string): SelectOption[] {
  const zones: string[] = [...TIMEZONES];
  if (extra && !zones.includes(extra)) zones.unshift(extra);
  return zones.map((zone) => ({ value: zone, label: zone.replaceAll('_', ' ') }));
}

export function currencyOptions(
  name: (code: keyof typeof ptBR.currencies) => string,
  extra?: string,
): SelectOption[] {
  const options: SelectOption[] = CURRENCY_CODES.map((code) => ({
    value: code,
    label: code,
    description: name(code),
  }));
  if (extra && !CURRENCY_CODES.some((code) => code === extra)) {
    options.unshift({ value: extra, label: extra });
  }
  return options;
}

export function defaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function defaultCurrency(): string {
  const device = getLocales()[0];
  const code = device?.currencyCode;
  if (code && CURRENCY_CODES.some((known) => known === code)) return code;
  return device?.languageCode === 'pt' ? 'BRL' : 'USD';
}
