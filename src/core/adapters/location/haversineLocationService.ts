import { err, ok, type Result } from "neverthrow";
import {
  type LocationService,
  LocationServiceError,
} from "@/core/domain/checkin/ports/locationService";
import type { ValidateLocationParams } from "@/core/domain/checkin/types";
import type { Coordinates } from "@/core/domain/region/types";

export class HaversineLocationService implements LocationService {
  /**
   * Validates if user location is within acceptable distance of place location
   */
  async validateUserLocation(
    params: ValidateLocationParams,
  ): Promise<Result<boolean, LocationServiceError>> {
    try {
      const distanceResult = await this.calculateDistance(
        params.userLocation,
        params.placeLocation,
      );

      if (distanceResult.isErr()) {
        return err(distanceResult.error);
      }

      const distanceMeters = distanceResult.value;
      const isValid = distanceMeters <= params.maxDistanceMeters;

      return ok(isValid);
    } catch (error) {
      return err(
        new LocationServiceError("Failed to validate user location", error),
      );
    }
  }

  /**
   * Calculates distance in meters between two coordinates using Haversine formula
   */
  async calculateDistance(
    from: Coordinates,
    to: Coordinates,
  ): Promise<Result<number, LocationServiceError>> {
    try {
      const R = 6371000; // Earth's radius in meters
      const φ1 = (from.latitude * Math.PI) / 180; // φ, λ in radians
      const φ2 = (to.latitude * Math.PI) / 180;
      const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
      const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const distance = R * c; // Distance in meters

      return ok(distance);
    } catch (error) {
      return err(
        new LocationServiceError("Failed to calculate distance", error),
      );
    }
  }

  /**
   * Checks if a point is within a specified radius of a center point
   */
  async isWithinRadius(
    center: Coordinates,
    point: Coordinates,
    radiusMeters: number,
  ): Promise<Result<boolean, LocationServiceError>> {
    try {
      const distanceResult = await this.calculateDistance(center, point);

      if (distanceResult.isErr()) {
        return err(distanceResult.error);
      }

      const distance = distanceResult.value;
      const isWithin = distance <= radiusMeters;

      return ok(isWithin);
    } catch (error) {
      return err(
        new LocationServiceError("Failed to check radius constraint", error),
      );
    }
  }

  /**
   * Gets address from coordinates (reverse geocoding)
   * Uses OpenStreetMap Nominatim API for reverse geocoding
   */
  async getAddressFromCoordinates(
    coordinates: Coordinates,
  ): Promise<Result<string, LocationServiceError>> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Kissa-App/1.0 (https://kissa.example.com)",
        },
      });

      if (!response.ok) {
        return err(
          new LocationServiceError(
            `Geocoding service returned ${response.status}: ${response.statusText}`,
          ),
        );
      }

      const data = await response.json();

      if (!data.display_name) {
        // Fallback to coordinates if no address found
        const address = `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
        return ok(address);
      }

      return ok(data.display_name);
    } catch (error) {
      return err(
        new LocationServiceError(
          "Failed to get address from coordinates",
          error,
        ),
      );
    }
  }

  /**
   * Gets coordinates from address (forward geocoding)
   * Uses OpenStreetMap Nominatim API for forward geocoding
   */
  async getCoordinatesFromAddress(
    address: string,
  ): Promise<Result<Coordinates | null, LocationServiceError>> {
    try {
      if (!address.trim()) {
        return ok(null);
      }

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Kissa-App/1.0 (https://kissa.example.com)",
        },
      });

      if (!response.ok) {
        return err(
          new LocationServiceError(
            `Geocoding service returned ${response.status}: ${response.statusText}`,
          ),
        );
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        // No results found
        return ok(null);
      }

      const result = data[0];
      const latitude = Number.parseFloat(result.lat);
      const longitude = Number.parseFloat(result.lon);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return err(
          new LocationServiceError(
            "Invalid coordinates received from geocoding service",
          ),
        );
      }

      return ok({ latitude, longitude });
    } catch (error) {
      return err(
        new LocationServiceError(
          "Failed to get coordinates from address",
          error,
        ),
      );
    }
  }
}
