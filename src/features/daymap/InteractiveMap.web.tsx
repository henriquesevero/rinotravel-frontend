import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { env } from '@/core/config/env';
import { currentLocale } from '@/core/i18n';
import { radius } from '@/shared/theme';

import type { InteractiveMapProps } from './InteractiveMap';
import { loadGoogleMaps } from './loader';

export type { InteractiveMapProps, MapPath, MapPin } from './InteractiveMap';

const BLUE = '#2563EB';
const DARK_BLUE = '#1E3A8A';

/** The day on a real Google map: numbered pins you can click, and the route between each pair. */
export function InteractiveMap({
  pins,
  paths,
  selectedIndex,
  onSelect,
  onError,
}: InteractiveMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const lines = useRef<google.maps.Polyline[]>([]);
  const info = useRef<google.maps.InfoWindow | null>(null);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    // Google calls this when the key is refused (wrong site address, API not enabled).
    window.gm_authFailure = () => onError();
    void loadGoogleMaps(env.googleMapsBrowserKey, currentLocale())
      .then(async () => {
        const { Map } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
        await google.maps.importLibrary('marker');
        if (cancelled || !container.current) return;
        map.current = new Map(container.current, {
          center: { lat: 0, lng: 0 },
          zoom: 2,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'cooperative',
          clickableIcons: false,
        });
        info.current = new google.maps.InfoWindow();
        draw();
      })
      .catch(() => onError());
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; drawing has its own effect
  }, []);

  function draw() {
    const current = map.current;
    if (!current) return;
    markers.current.forEach((marker) => marker.setMap(null));
    lines.current.forEach((line) => line.setMap(null));
    // Indexed like `pins`, with holes for stops that have no position, so selection lines up.
    markers.current = new Array<google.maps.Marker>(pins.length);
    lines.current = [];

    const bounds = new google.maps.LatLngBounds();
    for (const { points, color } of paths) {
      if (points.length === 0) continue;
      lines.current.push(
        new google.maps.Polyline({
          map: current,
          path: points,
          strokeColor: color,
          strokeOpacity: 0.85,
          strokeWeight: 5,
        }),
      );
      points.forEach((point) => bounds.extend(point));
    }
    pins.forEach((pin, index) => {
      if (!pin.position) return;
      bounds.extend(pin.position);
      const marker = new google.maps.Marker({
        map: current,
        position: pin.position,
        label: { text: pin.label, color: '#FFFFFF', fontWeight: '700', fontSize: '13px' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: pin.color,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        title: pin.title,
      });
      marker.addListener('click', () => onSelect(index));
      markers.current[index] = marker;
    });
    if (!bounds.isEmpty()) current.fitBounds(bounds, 48);
    highlight();
  }

  function highlight() {
    markers.current.forEach((marker, index) => {
      const selected = index === selectedIndex;
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: selected ? 19 : 15,
        fillColor: pins[index]?.color ?? BLUE,
        fillOpacity: 1,
        strokeColor: selected ? DARK_BLUE : '#FFFFFF',
        strokeWeight: selected ? 4 : 2,
      });
      marker.setZIndex(selected ? 1000 : index);
    });
    const pin = selectedIndex !== null ? pins[selectedIndex] : undefined;
    if (pin?.position && map.current && info.current) {
      const content = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = pin.title;
      content.appendChild(title);
      if (pin.time) {
        content.appendChild(document.createElement('br'));
        content.appendChild(document.createTextNode(pin.time));
      }
      info.current.setContent(content);
      info.current.setPosition(pin.position);
      info.current.open({ map: map.current });
      map.current.panTo(pin.position);
    } else {
      info.current?.close();
    }
  }

  // Redraw when the day changes; only restyle when just the selection changes.
  useEffect(draw, [pins, paths]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(highlight, [selectedIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.frame} testID="interactive-map">
      <div ref={container} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 300, borderRadius: radius.lg, overflow: 'hidden' },
});
