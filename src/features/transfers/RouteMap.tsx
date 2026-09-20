import { MapLinkCard, type RouteMapProps } from './MapLinkCard';

/**
 * Native apps open the maps app instead of embedding a page: it is the better experience on a phone
 * (turn-by-turn, live transit times) and needs no web view.
 */
export function RouteMap(props: RouteMapProps) {
  return <MapLinkCard {...props} />;
}
