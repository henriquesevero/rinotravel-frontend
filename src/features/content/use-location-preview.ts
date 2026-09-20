import type { Location, PlaceCandidate } from '@/core/api';
import { useDebouncedValue } from '@/core/hooks/use-debounced-value';

import { candidateToLocation, mergeLocation } from './mappers';

interface Options {
  /** What the name and address fields hold right now. */
  nameNow: string;
  addressNow: string;
  /** The suggestion picked for this place, if any. */
  pick: PlaceCandidate | null;
  /** The saved place being edited, whose coordinates are kept while its text is unchanged. */
  previous?: Location | null | undefined;
}

/**
 * The place a form describes so far, for its map. A picked suggestion is used at once and is exact;
 * typed text waits until it settles, so the map is not asked for at every keystroke.
 */
export function useLocationPreview({ nameNow, addressNow, pick, previous }: Options) {
  const nameTyped = useDebouncedValue(nameNow, 700);
  const addressTyped = useDebouncedValue(addressNow, 700);
  const settled = pick !== null && nameNow === pick.name && addressNow === (pick.address ?? '');
  const name = settled ? nameNow : nameTyped;
  const address = settled ? addressNow : addressTyped;

  const worthMapping = name.trim().length >= 3 || address.trim().length >= 3;
  const location = worthMapping
    ? mergeLocation(name, address, pick ? candidateToLocation(pick) : previous)
    : null;
  return { location, exact: location?.latitude !== undefined && location.longitude !== undefined };
}
