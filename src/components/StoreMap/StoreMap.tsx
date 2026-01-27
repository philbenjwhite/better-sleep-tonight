'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './StoreMap.module.css';

export interface MapLocation {
  id: string;
  city: string;
  storeName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface StoreMapProps {
  locations: MapLocation[];
  selectedLocationId?: string | null;
  userCoordinates?: { lat: number; lng: number };
  onMarkerClick?: (locationId: string) => void;
}

export const StoreMap: React.FC<StoreMapProps> = ({
  locations,
  selectedLocationId,
  userCoordinates,
  onMarkerClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!accessToken) {
      console.error('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = accessToken;

    // Calculate initial center and bounds from all locations
    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach((loc) => {
      bounds.extend([loc.coordinates.lng, loc.coordinates.lat]);
    });

    // If user coordinates exist, include them in bounds
    if (userCoordinates) {
      bounds.extend([userCoordinates.lng, userCoordinates.lat]);
    }

    const center = bounds.getCenter();

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom: 8,
    });

    map.current.on('load', () => {
      setMapLoaded(true);

      // Fit to bounds with padding
      if (map.current) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 12,
        });
      }
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [locations, userCoordinates]);

  // Add/update markers when map loads or locations change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add user location marker if available
    if (userCoordinates) {
      const userEl = document.createElement('div');
      userEl.className = styles.userMarker;
      userEl.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8" fill="#4285F4" stroke="white" stroke-width="3"/>
        </svg>
      `;

      new mapboxgl.Marker({ element: userEl })
        .setLngLat([userCoordinates.lng, userCoordinates.lat])
        .addTo(map.current);
    }

    // Add store markers
    locations.forEach((location) => {
      const isSelected = selectedLocationId === location.id;
      const el = document.createElement('div');
      el.className = `${styles.marker} ${isSelected ? styles.markerSelected : ''}`;

      // Use smaller markers by default (20x25), larger when selected (28x35)
      const width = isSelected ? 28 : 20;
      const height = isSelected ? 35 : 25;

      el.innerHTML = `
        <svg width="${width}" height="${height}" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24c0-8.84-7.16-16-16-16zm0 22c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="${isSelected ? '#f68b29' : '#363534'}"/>
        </svg>
      `;

      el.addEventListener('click', () => {
        onMarkerClick?.(location.id);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([location.coordinates.lng, location.coordinates.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: isSelected ? 20 : 15, closeButton: false })
            .setHTML(`
              <div class="${styles.popup}">
                <strong>${location.city}</strong>
                <span>${location.storeName}</span>
              </div>
            `)
        )
        .addTo(map.current!);

      markersRef.current.set(location.id, marker);
    });
  }, [mapLoaded, locations, selectedLocationId, userCoordinates, onMarkerClick]);

  // Fly to selected location
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedLocationId) return;

    const selectedLocation = locations.find((loc) => loc.id === selectedLocationId);
    if (selectedLocation) {
      map.current.flyTo({
        center: [selectedLocation.coordinates.lng, selectedLocation.coordinates.lat],
        zoom: 14,
        duration: 1000,
      });

      // Open the popup for the selected marker
      const marker = markersRef.current.get(selectedLocationId);
      if (marker) {
        marker.togglePopup();
      }
    }
  }, [selectedLocationId, locations, mapLoaded]);

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapContainer} className={styles.mapContainer} />
      {!mapLoaded && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
        </div>
      )}
    </div>
  );
};

export default StoreMap;
