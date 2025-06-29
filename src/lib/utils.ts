import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Geographic utility functions

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the distance between two points using the Haversine formula
 * @param point1 First coordinate point
 * @param point2 Second coordinate point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const lat1 = toRadians(point1.latitude);
  const lat2 = toRadians(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Create a more accurate bounding box for geographic search
 * @param center Center coordinates
 * @param radiusKm Radius in kilometers
 * @returns Bounding box coordinates
 */
export function createBoundingBox(center: Coordinates, radiusKm: number) {
  // More accurate latitude conversion (1 degree = ~111.32 km)
  const latDelta = radiusKm / 111.32;

  // More accurate longitude conversion accounting for latitude
  const lngDelta = radiusKm / (111.32 * Math.cos(toRadians(center.latitude)));

  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLng: center.longitude - lngDelta,
    maxLng: center.longitude + lngDelta,
  };
}

/**
 * Filter items by actual distance from a center point
 * @param items Items with coordinates property
 * @param center Center coordinates
 * @param radiusKm Maximum distance in kilometers
 * @returns Filtered items within the radius
 */
export function filterByDistance<T extends { coordinates?: Coordinates }>(
  items: T[],
  center: Coordinates,
  radiusKm: number,
): T[] {
  return items.filter((item) => {
    if (!item.coordinates) {
      return false;
    }

    const distance = calculateDistance(center, item.coordinates);

    return distance <= radiusKm;
  });
}

let keyCounter = 0;

/**
 * Generate a unique key for React elements
 * @param prefix Optional prefix for the key
 * @param index Optional index to make it unique
 * @returns A unique string key
 */
export function generateKey(prefix = "item", index?: number): string {
  keyCounter += 1;
  return index !== undefined
    ? `${prefix}-${index}-${keyCounter}`
    : `${prefix}-${keyCounter}`;
}
