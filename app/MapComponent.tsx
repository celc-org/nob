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
  const polylineRef = useRef<L.Polyline | null>(null);
  const initializedRef = useRef(false);
  const initialBoundsRef = useRef<L.LatLngBounds | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (mapRef.current && !mapInstanceRef.current && !initializedRef.current) {
      initializedRef.current = true;

      // Create map with smooth zoom settings
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        zoomSnap: 0.25, // Smoother zoom increments
        zoomDelta: 0.25,
        wheelPxPerZoomLevel: 120, // Smoother scroll zoom
        zoomAnimation: true,
        zoomAnimationThreshold: 4,
        fadeAnimation: true,
        markerZoomAnimation: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3,
      }).addTo(map);

      // Create route polyline
      const routeCoords = stops.map(
        (stop) => [stop.lat, stop.lng] as [number, number]
      );
      const polyline = L.polyline(routeCoords, {
        color: '#8b5cf6',
        weight: 5,
        opacity: 0.8,
        smoothFactor: 2,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);
      polylineRef.current = polyline;

      // Create markers
      stops.forEach((stop, index) => {
        const bgColor =
          index === 0
            ? '#10b981'
            : index === stops.length - 1
            ? '#3b82f6'
            : '#8b5cf6';

        const isStartEnd = index === 0 || index === stops.length - 1;

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: ${bgColor}; color: white; width: ${
            isStartEnd ? 36 : 32
          }px; height: ${
            isStartEnd ? 36 : 32
          }px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: ${
            isStartEnd ? 11 : 13
          }px; box-shadow: 0 3px 10px rgba(0,0,0,0.4); border: ${
            isStartEnd ? '3px' : '2px'
          } solid white; transition: all 0.3s ease;">${
            isStartEnd ? (index === 0 ? '🏁' : '🏆') : index + 1
          }</div>`,
          iconSize: [isStartEnd ? 36 : 32, isStartEnd ? 36 : 32],
        });

        const marker = L.marker([stop.lat, stop.lng], {
          icon,
          riseOnHover: true,
        }).addTo(map);

        marker.bindPopup(
          `<div style="font-weight: bold; font-size: 14px; color: #1e293b;">${
            stop.name
          }</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Stop #${
            index + 1
          }</div>`,
          {
            closeButton: true,
            autoClose: false,
          }
        );

        markersRef.current.push(marker);
      });

      // Fit bounds to show entire route with padding
      const bounds = L.latLngBounds(routeCoords);
      initialBoundsRef.current = bounds;
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14,
        animate: false,
      });

      mapInstanceRef.current = map;

      // Invalidate size after a short delay to ensure proper rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [stops]);

  // Handle current stop changes with smooth animation (NO AUTO-ZOOM)
  useEffect(() => {
    if (mapInstanceRef.current && markersRef.current[currentStop]) {
      const marker = markersRef.current[currentStop];

      // Update marker appearance for current stop
      markersRef.current.forEach((m, idx) => {
        const bgColor =
          idx === 0
            ? '#10b981'
            : idx === stops.length - 1
            ? '#3b82f6'
            : idx === currentStop
            ? '#ec4899'
            : '#8b5cf6';

        const isStartEnd = idx === 0 || idx === stops.length - 1;
        const isCurrent = idx === currentStop;

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: ${bgColor}; color: white; width: ${
            isCurrent ? 40 : isStartEnd ? 36 : 32
          }px; height: ${
            isCurrent ? 40 : isStartEnd ? 36 : 32
          }px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: ${
            isCurrent ? 14 : isStartEnd ? 11 : 13
          }px; box-shadow: 0 ${isCurrent ? 4 : 3}px ${
            isCurrent ? 15 : 10
          }px rgba(0,0,0,0.4); border: ${
            isCurrent ? '4px' : isStartEnd ? '3px' : '2px'
          } solid white; transition: all 0.3s ease; ${
            isCurrent
              ? 'box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7); animation: borderPulse 2s infinite;'
              : ''
          }">${isStartEnd ? (idx === 0 ? '🏁' : '🏆') : idx + 1}</div>
          <style>
          @keyframes borderPulse {
            0%, 100% { 
              box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7), 0 4px 15px rgba(0,0,0,0.4);
            }
            50% { 
              box-shadow: 0 0 0 8px rgba(236, 72, 153, 0), 0 4px 15px rgba(0,0,0,0.4);
            }
          }
          </style>`,
          iconSize: [
            isCurrent ? 40 : isStartEnd ? 36 : 32,
            isCurrent ? 40 : isStartEnd ? 36 : 32,
          ],
        });

        m.setIcon(icon);
      });

      // Just open the popup, DON'T move the map
      marker.openPopup();
    }
  }, [currentStop, stops]);

  // Handle map resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetZoom = () => {
    if (mapInstanceRef.current && initialBoundsRef.current) {
      mapInstanceRef.current.fitBounds(initialBoundsRef.current, {
        padding: [50, 50],
        maxZoom: 14,
        animate: true,
        duration: 0.5,
      });
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <button
        onClick={resetZoom}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '8px 12px',
          borderRadius: '6px',
          background: 'rgba(139, 92, 246, 0.9)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(139, 92, 246, 1)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.9)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        🔄 Reset Zoom
      </button>
      <div
        ref={mapRef}
        style={{
          height: '100%',
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
        }}
      ></div>
    </div>
  );
};

export default MapComponent;
