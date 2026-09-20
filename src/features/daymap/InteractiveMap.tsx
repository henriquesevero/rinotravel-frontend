import type { LatLng } from './polyline';

export interface MapPin {
  key: string;
  label: string;
  title: string;
  time: string;
  position: LatLng | null;
}

export interface InteractiveMapProps {
  pins: MapPin[];
  /** One line per trip between stops. */
  paths: LatLng[][];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onError: () => void;
}

/** Native apps show the day as a picture instead: an interactive web map needs the browser. */
export function InteractiveMap({ onError }: InteractiveMapProps) {
  void onError;
  return null;
}
