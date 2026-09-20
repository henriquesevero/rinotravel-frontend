import * as Crypto from 'expo-crypto';

/**
 * A UUIDv7 made on the device. Records created offline need their id before the server has seen
 * them, and a time-ordered id keeps lists stable and makes a retried create idempotent.
 */
export function newId(now: number = Date.now()): string {
  const bytes = Crypto.getRandomValues(new Uint8Array(16));
  const timestamp = BigInt(now);
  for (let index = 0; index < 6; index++) {
    bytes[index] = Number((timestamp >> BigInt(8 * (5 - index))) & 0xffn);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
