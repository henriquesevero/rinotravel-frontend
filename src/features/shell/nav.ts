import { usePathname, useRouter, type Href } from 'expo-router';

import type { IconName } from '@/shared/ui';

const TRIP_PATH = /^\/trips\/([0-9a-f-]{36})(\/.*)?$/;

type NavLabel =
  | 'nav.dashboard'
  | 'nav.trips'
  | 'nav.newTrip'
  | 'nav.overview'
  | 'nav.itinerary'
  | 'nav.places'
  | 'nav.bookings'
  | 'nav.expenses'
  | 'nav.transfers'
  | 'nav.documents'
  | 'nav.members';

export interface NavItem {
  key: string;
  labelKey: NavLabel;
  icon: IconName;
  activeIcon: IconName;
  href: Href;
  active: boolean;
}

export interface NavState {
  main: NavItem[];
  /** Present only while a trip is open. */
  tripId: string | null;
  trip: NavItem[];
  /** Forms with a sticky primary action hide the phone tab bar so they never stack. */
  hidesTabBar: boolean;
  go: (href: Href) => void;
}

/** How many trip sections fit in the phone tab bar; the rest live under "More". */
export const PHONE_TRIP_TABS = 4;

export function useNavState(): NavState {
  const pathname = usePathname();
  const router = useRouter();

  const match = TRIP_PATH.exec(pathname);
  const tripId = match?.[1] ?? null;
  const subpath = match?.[2] ?? '';

  const main: NavItem[] = [
    {
      key: 'dashboard',
      labelKey: 'nav.dashboard',
      icon: 'grid-outline',
      activeIcon: 'grid',
      href: '/',
      active: pathname === '/',
    },
    {
      key: 'trips',
      labelKey: 'nav.trips',
      icon: 'airplane-outline',
      activeIcon: 'airplane',
      href: '/trips',
      active: pathname === '/trips' || (tripId !== null && pathname.startsWith('/trips/')),
    },
    {
      key: 'new',
      labelKey: 'nav.newTrip',
      icon: 'add-circle-outline',
      activeIcon: 'add-circle',
      href: '/trips/new',
      active: pathname === '/trips/new',
    },
  ];

  const section = (
    key: string,
    labelKey: NavLabel,
    icon: IconName,
    activeIcon: IconName,
    path:
      | ''
      | '/itinerary'
      | '/places'
      | '/bookings'
      | '/expenses'
      | '/transfers'
      | '/documents'
      | '/members',
    isActive: boolean,
  ): NavItem => ({
    key,
    labelKey,
    icon,
    activeIcon,
    href: tripId
      ? ({ pathname: `/trips/[id]${path}`, params: { id: tripId } } as Href)
      : ('/' as Href),
    active: isActive,
  });

  const trip: NavItem[] = tripId
    ? [
        section(
          'overview',
          'nav.overview',
          'home-outline',
          'home',
          '',
          subpath === '' || subpath === '/edit',
        ),
        section(
          'itinerary',
          'nav.itinerary',
          'calendar-outline',
          'calendar',
          '/itinerary',
          subpath === '/itinerary',
        ),
        section(
          'places',
          'nav.places',
          'location-outline',
          'location',
          '/places',
          subpath === '/places',
        ),
        section(
          'bookings',
          'nav.bookings',
          'ticket-outline',
          'ticket',
          '/bookings',
          subpath === '/bookings',
        ),
        section(
          'expenses',
          'nav.expenses',
          'wallet-outline',
          'wallet',
          '/expenses',
          subpath === '/expenses',
        ),
        section(
          'transfers',
          'nav.transfers',
          'swap-horizontal-outline',
          'swap-horizontal',
          '/transfers',
          subpath === '/transfers',
        ),
        section(
          'documents',
          'nav.documents',
          'folder-open-outline',
          'folder-open',
          '/documents',
          subpath === '/documents',
        ),
        section(
          'members',
          'nav.members',
          'people-outline',
          'people',
          '/members',
          subpath === '/members',
        ),
      ]
    : [];

  return {
    main,
    tripId,
    trip,
    hidesTabBar: pathname === '/trips/new' || pathname.endsWith('/edit'),
    go: (href) => router.navigate(href),
  };
}
