'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import styles from './StoreLocations.module.css';
import { StoreMap } from '@/components/StoreMap';

// Import locations data
import locationsData from '../../../content/locations/ontario-stores.json';

export interface StoreLocation {
  id: string;
  city: string;
  storeName: string;
  address: string;
  storePhone: string;
  customerServicePhone: string | null;
  websiteUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface StoreLocationsContent {
  headerText: string;
  defaultPostalCode?: string;
  ctaBookTitle: string;
  ctaBookDescription: string;
  ctaBookButtonText: string;
  ctaContactTitle: string;
  ctaContactDescription: string;
  ctaContactButtonText: string;
}

export interface StoreLocationsProps {
  content: StoreLocationsContent;
  postalCode: string;
  userCoordinates?: { lat: number; lng: number };
  onLocationSelect?: (location: StoreLocation) => void;
  onBookRestTest?: () => void;
  onContactUs?: () => void;
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format phone number for display
function formatPhone(phone: string): string {
  // Remove the + and format as readable
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

// Format phone number for tel: link
function getTelLink(phone: string): string {
  return `tel:${phone}`;
}

// Get Google Maps directions URL
function getDirectionsUrl(address: string, city: string): string {
  const query = encodeURIComponent(`${address}, ${city}, Ontario, Canada`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

export const StoreLocations: React.FC<StoreLocationsProps> = ({
  content,
  postalCode,
  userCoordinates = { lat: 43.3894, lng: -79.7624 }, // Default to Burlington area (L7M postal code)
  onLocationSelect,
  onBookRestTest,
  onContactUs,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const locationCardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const hasInitializedRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      setIsScrolledDown(scrollTop > 10);
      setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
    }
  }, []);

  // Calculate distances and sort locations
  const sortedLocations = useMemo(() => {
    const locations = locationsData.locations as StoreLocation[];
    return locations
      .map((location) => ({
        ...location,
        distance: calculateDistance(
          userCoordinates.lat,
          userCoordinates.lng,
          location.coordinates.lat,
          location.coordinates.lng
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [userCoordinates]);

  // Auto-select the closest location on initial load
  useEffect(() => {
    if (!hasInitializedRef.current && sortedLocations.length > 0) {
      hasInitializedRef.current = true;
      const closestLocation = sortedLocations[0];
      setSelectedLocationId(closestLocation.id);
      onLocationSelect?.(closestLocation);
    }
  }, [sortedLocations, onLocationSelect]);

  const handleLocationClick = (location: StoreLocation) => {
    setSelectedLocationId(location.id);
    onLocationSelect?.(location);
  };

  const scrollToLocation = useCallback((locationId: string) => {
    const cardElement = locationCardRefs.current.get(locationId);
    if (cardElement && listRef.current) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  return (
    <div className={styles.storeLocationsContainer}>
      {/* Header */}
      <h2 className={styles.headerText}>
        {content.headerText} {postalCode}
      </h2>

      {/* Main Content */}
      <div className={styles.contentWrapper}>
        {/* Left Column - Locations List */}
        <div className={`${styles.locationsListWrapper} ${isScrolledDown ? styles.scrolledDown : ''} ${isAtBottom ? styles.atBottom : ''}`}>
          <div className={styles.locationsList} ref={listRef} onScroll={handleScroll}>
            {sortedLocations.map((location) => (
              <button
                key={location.id}
                ref={(el) => {
                  if (el) {
                    locationCardRefs.current.set(location.id, el);
                  }
                }}
                type="button"
                className={`${styles.locationCard} ${
                  selectedLocationId === location.id ? styles.selected : ''
                }`}
                onClick={() => handleLocationClick(location)}
              >
                <div className={styles.locationInfo}>
                  <p className={styles.cityName}>{location.city}</p>
                  <p className={styles.storeName}>{location.storeName}</p>
                </div>
                <div className={styles.locationActions}>
                  <p className={styles.distance}>
                    {location.distance < 1
                      ? `${(location.distance * 1000).toFixed(0)} m away`
                      : `${location.distance.toFixed(1)} km away`}
                  </p>
                  <div className={styles.actionLinks}>
                    <a
                      href={location.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.actionLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Website
                    </a>
                    <span className={styles.linkSeparator}>|</span>
                    <a
                      href={getDirectionsUrl(location.address, location.city)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.actionLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Get Directions
                    </a>
                    <span className={styles.linkSeparator}>|</span>
                    <a
                      href={getTelLink(location.storePhone)}
                      className={styles.actionLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Call
                    </a>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className={styles.sidebar}>
          {/* Interactive Map */}
          <div className={styles.mapContainer}>
            <StoreMap
              locations={sortedLocations}
              selectedLocationId={selectedLocationId}
              userCoordinates={userCoordinates}
              onMarkerClick={(locationId) => {
                setSelectedLocationId(locationId);
                scrollToLocation(locationId);
                const location = sortedLocations.find((loc) => loc.id === locationId);
                if (location) {
                  onLocationSelect?.(location);
                }
              }}
            />
          </div>

          {/* CTA Section 1 - Book a Rest Test */}
          <div className={styles.ctaSection}>
            <div className={styles.ctaText}>
              <p className={styles.ctaTitle}>{content.ctaBookTitle}</p>
              <p className={styles.ctaDescription}>{content.ctaBookDescription}</p>
            </div>
            <button
              type="button"
              className={styles.ctaButton}
              onClick={onBookRestTest}
            >
              {content.ctaBookButtonText}
            </button>
          </div>

          {/* CTA Section 2 - Contact Us */}
          <div className={styles.ctaSection}>
            <div className={styles.ctaText}>
              <p className={styles.ctaTitle}>{content.ctaContactTitle}</p>
              <p className={styles.ctaDescription}>{content.ctaContactDescription}</p>
            </div>
            <button
              type="button"
              className={styles.ctaButtonOutline}
              onClick={onContactUs}
            >
              {content.ctaContactButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreLocations;
