'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface Stop {
  name: string;
  lat: number;
  lng: number;
  type?: 'start' | 'finish';
}

interface MapComponentProps {
  stops: Stop[];
  currentStop: number;
}

const MapComponent = ({ stops, currentStop }: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView(
        [stops[0].lat, stops[0].lng],
        12
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const routeCoords = stops.map(
        (stop) => [stop.lat, stop.lng] as [number, number]
      );
      L.polyline(routeCoords, {
        color: '#667eea',
        weight: 4,
        opacity: 0.7,
      }).addTo(map);

      stops.forEach((stop, index) => {
        const bgColor =
          index === 0
            ? '#10b981'
            : index === stops.length - 1
            ? '#3b82f6'
            : '#667eea';
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: ${bgColor}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${
            index + 1
          }</div>`,
          iconSize: [30, 30],
        });

        const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map);
        marker.bindPopup(`<b>${stop.name}</b>`);
        markersRef.current.push(marker);
      });

      mapInstanceRef.current = map;
    }
  }, [stops]);

  useEffect(() => {
    if (mapInstanceRef.current && markersRef.current[currentStop]) {
      mapInstanceRef.current.setView(
        [stops[currentStop].lat, stops[currentStop].lng],
        13
      );
      markersRef.current[currentStop].openPopup();
    }
  }, [currentStop, stops]);

  return (
    <div
      ref={mapRef}
      style={{ height: '300px', borderRadius: '12px', overflow: 'hidden' }}
    ></div>
  );
};

export default MapComponent;
