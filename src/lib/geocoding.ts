/**
 * Geocoding utility for converting postal codes to coordinates
 * Uses Mapbox Geocoding API
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  coordinates: Coordinates | null;
  formattedAddress: string | null;
  error: string | null;
}

/**
 * Convert a Canadian postal code to geographic coordinates using Mapbox Geocoding API
 * @param postalCode - Canadian postal code (e.g., "L7M 1A1" or "L7M1A1")
 * @returns Promise with coordinates, formatted address, or error
 */
export async function geocodePostalCode(postalCode: string): Promise<GeocodingResult> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!accessToken) {
    console.warn('Mapbox access token not configured, using fallback coordinates');
    return {
      coordinates: null,
      formattedAddress: null,
      error: 'Mapbox token not configured',
    };
  }

  // Clean and format the postal code
  const cleanedPostalCode = postalCode.replace(/\s/g, '').toUpperCase();

  // Add space in the middle if not present (A1A1A1 -> A1A 1A1)
  const formattedPostalCode = cleanedPostalCode.length === 6
    ? `${cleanedPostalCode.slice(0, 3)} ${cleanedPostalCode.slice(3)}`
    : postalCode;

  try {
    // Mapbox Geocoding API endpoint
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(formattedPostalCode + ', Canada')}.json`);
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('country', 'CA'); // Restrict to Canada
    url.searchParams.set('types', 'postcode,locality,place'); // Search for postal codes and places
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Mapbox Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const result = data.features[0];
      // Mapbox returns [lng, lat] in the center array
      return {
        coordinates: {
          lat: result.center[1],
          lng: result.center[0],
        },
        formattedAddress: result.place_name,
        error: null,
      };
    } else {
      return {
        coordinates: null,
        formattedAddress: null,
        error: 'No results found for this postal code',
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      coordinates: null,
      formattedAddress: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fallback coordinates for Ontario FSA (Forward Sortation Area) codes
 * Uses approximate center points for the first 3 characters of postal codes
 */
const ONTARIO_FSA_COORDINATES: Record<string, Coordinates> = {
  // Greater Toronto Area
  'M1A': { lat: 43.7, lng: -79.4 }, // Toronto
  'M2J': { lat: 43.78, lng: -79.35 },
  'M4B': { lat: 43.7, lng: -79.31 },
  'M5A': { lat: 43.65, lng: -79.36 },
  'M6A': { lat: 43.72, lng: -79.45 },
  'L1A': { lat: 43.87, lng: -78.87 }, // Durham
  'L3R': { lat: 43.85, lng: -79.38 }, // Markham
  'L4B': { lat: 43.86, lng: -79.43 }, // Richmond Hill
  'L4C': { lat: 43.88, lng: -79.44 },
  'L4J': { lat: 43.81, lng: -79.42 },
  'L4K': { lat: 43.81, lng: -79.47 },
  'L4L': { lat: 43.79, lng: -79.52 },
  'L4S': { lat: 43.87, lng: -79.43 },
  'L4T': { lat: 43.69, lng: -79.62 }, // Mississauga
  'L4W': { lat: 43.63, lng: -79.62 },
  'L4X': { lat: 43.6, lng: -79.57 },
  'L4Y': { lat: 43.59, lng: -79.56 },
  'L4Z': { lat: 43.58, lng: -79.61 },
  'L5A': { lat: 43.57, lng: -79.62 },
  'L5B': { lat: 43.59, lng: -79.64 },
  'L5C': { lat: 43.57, lng: -79.66 },
  'L5E': { lat: 43.56, lng: -79.59 },
  'L5G': { lat: 43.54, lng: -79.58 },
  'L5H': { lat: 43.53, lng: -79.6 },
  'L5J': { lat: 43.51, lng: -79.63 },
  'L5K': { lat: 43.52, lng: -79.67 },
  'L5L': { lat: 43.54, lng: -79.67 },
  'L5M': { lat: 43.56, lng: -79.72 },
  'L5N': { lat: 43.58, lng: -79.75 },
  'L5R': { lat: 43.6, lng: -79.68 },
  'L5T': { lat: 43.64, lng: -79.7 },
  'L5V': { lat: 43.6, lng: -79.73 },
  'L5W': { lat: 43.62, lng: -79.73 },
  'L6A': { lat: 43.86, lng: -79.48 }, // Vaughan
  'L6B': { lat: 43.88, lng: -79.51 },
  'L6C': { lat: 43.86, lng: -79.41 },
  'L6E': { lat: 43.9, lng: -79.45 },
  'L6G': { lat: 43.78, lng: -79.49 },
  'L6H': { lat: 43.47, lng: -79.7 }, // Oakville
  'L6J': { lat: 43.45, lng: -79.68 },
  'L6K': { lat: 43.44, lng: -79.68 },
  'L6L': { lat: 43.43, lng: -79.71 },
  'L6M': { lat: 43.42, lng: -79.74 },
  'L6P': { lat: 43.81, lng: -79.56 }, // Brampton
  'L6R': { lat: 43.73, lng: -79.74 },
  'L6S': { lat: 43.75, lng: -79.75 },
  'L6T': { lat: 43.72, lng: -79.75 },
  'L6V': { lat: 43.68, lng: -79.76 },
  'L6W': { lat: 43.7, lng: -79.78 },
  'L6X': { lat: 43.69, lng: -79.73 },
  'L6Y': { lat: 43.67, lng: -79.74 },
  'L6Z': { lat: 43.71, lng: -79.8 },
  'L7A': { lat: 43.66, lng: -79.78 },
  'L7C': { lat: 43.76, lng: -79.8 },
  'L7G': { lat: 43.63, lng: -79.86 }, // Georgetown
  'L7J': { lat: 43.66, lng: -79.94 },
  'L7K': { lat: 43.73, lng: -79.92 },
  'L7L': { lat: 43.37, lng: -79.79 }, // Burlington
  'L7M': { lat: 43.39, lng: -79.76 },
  'L7N': { lat: 43.32, lng: -79.8 },
  'L7P': { lat: 43.35, lng: -79.83 },
  'L7R': { lat: 43.33, lng: -79.79 },
  'L7S': { lat: 43.32, lng: -79.79 },
  'L7T': { lat: 43.34, lng: -79.84 },
  'L8E': { lat: 43.21, lng: -79.75 }, // Hamilton
  'L8G': { lat: 43.22, lng: -79.79 },
  'L8H': { lat: 43.24, lng: -79.81 },
  'L8J': { lat: 43.2, lng: -79.77 },
  'L8K': { lat: 43.23, lng: -79.84 },
  'L8L': { lat: 43.25, lng: -79.85 },
  'L8M': { lat: 43.25, lng: -79.87 },
  'L8N': { lat: 43.26, lng: -79.87 },
  'L8P': { lat: 43.26, lng: -79.88 },
  'L8R': { lat: 43.26, lng: -79.89 },
  'L8S': { lat: 43.26, lng: -79.9 },
  'L8T': { lat: 43.24, lng: -79.88 },
  'L8V': { lat: 43.23, lng: -79.89 },
  'L8W': { lat: 43.21, lng: -79.85 },
  'L9A': { lat: 43.24, lng: -79.92 },
  'L9B': { lat: 43.21, lng: -79.91 },
  'L9C': { lat: 43.22, lng: -79.94 },
  'L9G': { lat: 43.26, lng: -80.0 },
  'L9H': { lat: 43.27, lng: -79.95 },
  'L9K': { lat: 43.3, lng: -79.89 },
  'N1E': { lat: 43.55, lng: -80.25 }, // Guelph
  'N1G': { lat: 43.52, lng: -80.23 },
  'N1H': { lat: 43.54, lng: -80.26 },
  'N1K': { lat: 43.52, lng: -80.28 },
  'N1L': { lat: 43.56, lng: -80.28 },
  'N2A': { lat: 43.42, lng: -80.46 }, // Kitchener
  'N2B': { lat: 43.44, lng: -80.48 },
  'N2C': { lat: 43.42, lng: -80.44 },
  'N2E': { lat: 43.41, lng: -80.47 },
  'N2G': { lat: 43.45, lng: -80.49 },
  'N2H': { lat: 43.45, lng: -80.5 },
  'N2J': { lat: 43.46, lng: -80.51 },
  'N2K': { lat: 43.47, lng: -80.48 },
  'N2L': { lat: 43.47, lng: -80.53 }, // Waterloo
  'N2M': { lat: 43.45, lng: -80.46 },
  'N2N': { lat: 43.44, lng: -80.51 },
  'N2P': { lat: 43.41, lng: -80.51 },
  'N2R': { lat: 43.4, lng: -80.43 },
  'N2T': { lat: 43.49, lng: -80.55 },
  'N2V': { lat: 43.51, lng: -80.55 },
  'K1A': { lat: 45.42, lng: -75.7 }, // Ottawa
  'K1B': { lat: 45.43, lng: -75.62 },
  'K1C': { lat: 45.46, lng: -75.51 },
  'K1E': { lat: 45.46, lng: -75.47 },
  'K1G': { lat: 45.41, lng: -75.63 },
  'K1H': { lat: 45.39, lng: -75.67 },
  'K1J': { lat: 45.44, lng: -75.62 },
  'K1K': { lat: 45.45, lng: -75.65 },
  'K1L': { lat: 45.44, lng: -75.67 },
  'K1M': { lat: 45.45, lng: -75.69 },
  'K1N': { lat: 45.43, lng: -75.69 },
  'K1P': { lat: 45.42, lng: -75.7 },
  'K1R': { lat: 45.41, lng: -75.72 },
  'K1S': { lat: 45.4, lng: -75.69 },
  'K1T': { lat: 45.36, lng: -75.63 },
  'K1V': { lat: 45.37, lng: -75.67 },
  'K1W': { lat: 45.46, lng: -75.56 },
  'K1X': { lat: 45.34, lng: -75.63 },
  'K1Y': { lat: 45.4, lng: -75.73 },
  'K1Z': { lat: 45.4, lng: -75.75 },
  'K2A': { lat: 45.38, lng: -75.76 },
  'K2B': { lat: 45.37, lng: -75.78 },
  'K2C': { lat: 45.36, lng: -75.77 },
  'K2E': { lat: 45.35, lng: -75.72 },
  'K2G': { lat: 45.35, lng: -75.76 },
  'K2H': { lat: 45.34, lng: -75.81 },
  'K2J': { lat: 45.29, lng: -75.76 },
  'K2K': { lat: 45.35, lng: -75.9 },
  'K2L': { lat: 45.33, lng: -75.88 },
  'K2M': { lat: 45.31, lng: -75.87 },
  'K2P': { lat: 45.41, lng: -75.69 },
  'K2R': { lat: 45.32, lng: -75.82 },
  'K2S': { lat: 45.3, lng: -75.93 },
  'K2T': { lat: 45.3, lng: -75.9 },
  'K2V': { lat: 45.33, lng: -75.93 },
  'K2W': { lat: 45.35, lng: -75.95 },
  'K4A': { lat: 45.46, lng: -75.44 },
  'K4B': { lat: 45.41, lng: -75.47 },
  'K4C': { lat: 45.5, lng: -75.47 },
  'K4K': { lat: 45.57, lng: -75.47 },
  'K4M': { lat: 45.27, lng: -75.62 },
  'K4P': { lat: 45.24, lng: -75.55 },
  'K6A': { lat: 45.06, lng: -74.74 }, // Cornwall
  'K7A': { lat: 44.23, lng: -76.48 }, // Kingston
  'K7K': { lat: 44.24, lng: -76.5 },
  'K7L': { lat: 44.23, lng: -76.49 },
  'K7M': { lat: 44.25, lng: -76.53 },
  'K7P': { lat: 44.26, lng: -76.57 },
  'K8N': { lat: 44.16, lng: -77.38 }, // Belleville
  'K8P': { lat: 44.17, lng: -77.38 },
  'K8R': { lat: 44.18, lng: -77.37 },
  'K9A': { lat: 44.3, lng: -78.32 }, // Peterborough
  'K9H': { lat: 44.29, lng: -78.32 },
  'K9J': { lat: 44.3, lng: -78.33 },
  'K9K': { lat: 44.32, lng: -78.31 },
  'K9L': { lat: 44.34, lng: -78.35 },
  'N3A': { lat: 43.13, lng: -80.26 }, // Brantford
  'N3P': { lat: 43.14, lng: -80.26 },
  'N3R': { lat: 43.14, lng: -80.24 },
  'N3S': { lat: 43.16, lng: -80.26 },
  'N3T': { lat: 43.15, lng: -80.27 },
  'N3V': { lat: 43.13, lng: -80.21 },
  'N5A': { lat: 43.04, lng: -81.15 }, // London
  'N5V': { lat: 43.02, lng: -81.24 },
  'N5W': { lat: 43.0, lng: -81.22 },
  'N5X': { lat: 43.02, lng: -81.28 },
  'N5Y': { lat: 43.0, lng: -81.26 },
  'N5Z': { lat: 42.98, lng: -81.23 },
  'N6A': { lat: 42.98, lng: -81.25 },
  'N6B': { lat: 42.99, lng: -81.24 },
  'N6C': { lat: 42.96, lng: -81.24 },
  'N6E': { lat: 42.95, lng: -81.22 },
  'N6G': { lat: 43.0, lng: -81.28 },
  'N6H': { lat: 43.01, lng: -81.32 },
  'N6J': { lat: 42.97, lng: -81.28 },
  'N6K': { lat: 42.95, lng: -81.3 },
  'N6L': { lat: 42.93, lng: -81.25 },
  'N6M': { lat: 43.06, lng: -81.28 },
  'N6N': { lat: 43.05, lng: -81.2 },
  'N6P': { lat: 42.92, lng: -81.28 },
  'P1A': { lat: 46.31, lng: -79.45 }, // North Bay
  'P1B': { lat: 46.32, lng: -79.47 },
  'P1C': { lat: 46.3, lng: -79.42 },
  'P3A': { lat: 46.49, lng: -81.0 }, // Sudbury
  'P3B': { lat: 46.48, lng: -81.02 },
  'P3C': { lat: 46.49, lng: -80.98 },
  'P3E': { lat: 46.5, lng: -81.0 },
  'P3G': { lat: 46.51, lng: -80.95 },
  'P3L': { lat: 46.47, lng: -80.99 },
  'P3N': { lat: 46.52, lng: -80.97 },
  'P3P': { lat: 46.48, lng: -80.96 },
  'P3Y': { lat: 46.49, lng: -80.91 },
  'P7A': { lat: 48.41, lng: -89.24 }, // Thunder Bay
  'P7B': { lat: 48.43, lng: -89.26 },
  'P7C': { lat: 48.4, lng: -89.21 },
  'P7E': { lat: 48.46, lng: -89.26 },
  'P7G': { lat: 48.47, lng: -89.29 },
  'P7J': { lat: 48.39, lng: -89.3 },
  'P7K': { lat: 48.44, lng: -89.32 },
};

/**
 * Get coordinates from FSA (first 3 characters of postal code) using fallback table
 * @param postalCode - Full postal code or just FSA
 * @returns Coordinates if found, null otherwise
 */
export function getCoordinatesFromFSA(postalCode: string): Coordinates | null {
  const fsa = postalCode.replace(/\s/g, '').toUpperCase().slice(0, 3);
  return ONTARIO_FSA_COORDINATES[fsa] || null;
}

/**
 * Geocode a postal code with fallback to FSA lookup
 * @param postalCode - Canadian postal code
 * @returns Promise with coordinates (API result or fallback)
 */
export async function geocodeWithFallback(postalCode: string): Promise<Coordinates | null> {
  // Try API first
  const result = await geocodePostalCode(postalCode);

  if (result.coordinates) {
    return result.coordinates;
  }

  // Fallback to FSA lookup
  console.log('Falling back to FSA lookup for:', postalCode);
  return getCoordinatesFromFSA(postalCode);
}
