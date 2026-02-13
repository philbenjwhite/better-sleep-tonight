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
  /** Pan to this location without changing selection styling */
  panToLocationId?: string | null;
  userCoordinates?: { lat: number; lng: number };
  onMarkerClick?: (locationId: string) => void;
}

export const StoreMap: React.FC<StoreMapProps> = ({
  locations,
  selectedLocationId,
  panToLocationId,
  userCoordinates,
  onMarkerClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Keep the callback ref updated
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // Initialize map (only once)
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
      if (!map.current) return;

      // Add individual markers for each location
      locations.forEach((location) => {
        const el = document.createElement('div');
        el.className = styles.marker;
        // Don't set inline width/height - let CSS handle it to avoid offset accumulation issues
        el.innerHTML = `
          <svg width="20" height="25" viewBox="0 0 20 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 15 10 15s10-7.5 10-15c0-5.52-4.48-10-10-10zm0 13.75c-2.07 0-3.75-1.68-3.75-3.75S7.93 6.25 10 6.25s3.75 1.68 3.75 3.75-1.68 3.75-3.75 3.75z" fill="#f68b29"/>
          </svg>
        `;

        el.addEventListener('click', () => {
          onMarkerClickRef.current?.(location.id);
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([location.coordinates.lng, location.coordinates.lat])
          .addTo(map.current!);

        markersRef.current.set(location.id, marker);
      });

      // Fit to bounds with padding
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });

      setMapLoaded(true);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      // Clean up markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Add user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !userCoordinates) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userEl = document.createElement('div');
    userEl.className = styles.userMarker;
    userEl.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="8" fill="#4285F4" stroke="white" stroke-width="3"/>
      </svg>
    `;

    userMarkerRef.current = new mapboxgl.Marker({ element: userEl })
      .setLngLat([userCoordinates.lng, userCoordinates.lat])
      .addTo(map.current);
  }, [mapLoaded, userCoordinates]);

  // Handle selected location - update marker style and show popup
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove previous popup and detach from any marker
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    // Also clear any existing popup attachments from all markers
    markersRef.current.forEach((marker) => {
      const existingPopup = marker.getPopup();
      if (existingPopup) {
        existingPopup.remove();
        marker.setPopup(undefined as unknown as mapboxgl.Popup);
      }
    });

    // Reset all markers to default style
    // Use consistent container size to prevent popup offset accumulation
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      const isSelected = id === selectedLocationId;

      // Keep container size consistent, only change the SVG inside
      el.className = isSelected ? `${styles.marker} ${styles.markerSelected}` : styles.marker;

      if (isSelected) {
        el.innerHTML = `
          <svg width="28" height="35" viewBox="0 0 28 35" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 21 14 21s14-10.5 14-21c0-7.73-6.27-14-14-14zm0 19.25c-2.9 0-5.25-2.35-5.25-5.25S11.1 8.75 14 8.75s5.25 2.35 5.25 5.25-2.35 5.25-5.25 5.25z" fill="#f68b29"/>
          </svg>
        `;
      } else {
        el.innerHTML = `
          <svg width="20" height="25" viewBox="0 0 20 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 15 10 15s10-7.5 10-15c0-5.52-4.48-10-10-10zm0 13.75c-2.07 0-3.75-1.68-3.75-3.75S7.93 6.25 10 6.25s3.75 1.68 3.75 3.75-1.68 3.75-3.75 3.75z" fill="#f68b29"/>
          </svg>
        `;
      }
    });

    if (!selectedLocationId) return;

    const selectedLocation = locations.find((loc) => loc.id === selectedLocationId);
    if (!selectedLocation) return;

    const selectedMarker = markersRef.current.get(selectedLocationId);
    if (!selectedMarker) return;

    // Add popup attached to the marker (not to a coordinate)
    // This ensures consistent positioning regardless of map state
    popupRef.current = new mapboxgl.Popup({
      offset: [0, -10], // Small offset from top of marker
      anchor: 'bottom',
      closeButton: false,
    })
      .setHTML(`
        <div class="${styles.popup}">
          <strong>${selectedLocation.city}</strong>
          <span>${selectedLocation.storeName}</span>
        </div>
      `);

    // Attach popup to the marker instead of setting LngLat
    selectedMarker.setPopup(popupRef.current);
    popupRef.current.addTo(map.current);

    // Fly to selected location
    map.current.flyTo({
      center: [selectedLocation.coordinates.lng, selectedLocation.coordinates.lat],
      zoom: 14,
      duration: 1000,
    });
  }, [selectedLocationId, locations, mapLoaded]);

  // Handle pan-only (Show on Map) — flies to location without changing selection
  useEffect(() => {
    if (!map.current || !mapLoaded || !panToLocationId) return;

    const location = locations.find((loc) => loc.id === panToLocationId);
    if (!location) return;

    map.current.flyTo({
      center: [location.coordinates.lng, location.coordinates.lat],
      zoom: 14,
      duration: 1000,
    });
  }, [panToLocationId, locations, mapLoaded]);

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
