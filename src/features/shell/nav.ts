import { usePathname, useRouter, type Href } from 'expo-router';

import type { IconName } from '@/shared/ui';

const TRIP_PATH = /^\/trips\/([0-9a-f-]{36})(\/.*)?$/;

export interface NavItem {
  key: string;
  labelKey: 'nav.trips' | 'nav.newTrip' | 'nav.overview' | 'nav.members';
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

export function useNavState(): NavState {
  const pathname = usePathname();
  const router = useRouter();

  const match = TRIP_PATH.exec(pathname);
  const tripId = match?.[1] ?? null;
  const tripSubpath = match?.[2] ?? '';

  const main: NavItem[] = [
    {
      key: 'trips',
      labelKey: 'nav.trips',
      icon: 'airplane-outline',
      activeIcon: 'airplane',
      href: '/',
      active: pathname === '/' || (pathname.startsWith('/trips/') && pathname !== '/trips/new'),
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

  const trip: NavItem[] = tripId
    ? [
        {
          key: 'overview',
          labelKey: 'nav.overview',
          icon: 'home-outline',
          activeIcon: 'home',
          href: { pathname: '/trips/[id]', params: { id: tripId } },
          active: tripSubpath === '' || tripSubpath === '/edit',
        },
        {
          key: 'members',
          labelKey: 'nav.members',
          icon: 'people-outline',
          activeIcon: 'people',
          href: { pathname: '/trips/[id]/members', params: { id: tripId } },
          active: tripSubpath === '/members',
        },
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
