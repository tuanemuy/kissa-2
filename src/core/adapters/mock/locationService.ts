import { err, ok, type Result } from "neverthrow";
import {
  type LocationService,
  LocationServiceError,
} from "@/core/domain/checkin/ports/locationService";
import type { ValidateLocationParams } from "@/core/domain/checkin/types";
import type { Coordinates } from "@/core/domain/region/types";

export class MockLocationService implements LocationService {
  private shouldFail = false;
  private mockValidationResult = true;
  private mockDistance = 100; // meters
  private mockAddress = "Mock Address, Mock City, Mock Country";
  private mockCoordinates: Coordinates = {
    latitude: 35.6762,
    longitude: 139.6503,
  }; // Tokyo coordinates

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setMockValidationResult(result: boolean): void {
    this.mockValidationResult = result;
  }

  setMockDistance(distance: number): void {
    this.mockDistance = distance;
  }

  setMockAddress(address: string): void {
    this.mockAddress = address;
  }

  setMockCoordinates(coordinates: Coordinates): void {
    this.mockCoordinates = coordinates;
  }

  reset(): void {
    this.shouldFail = false;
    this.mockValidationResult = true;
    this.mockDistance = 100;
    this.mockAddress = "Mock Address, Mock City, Mock Country";
    this.mockCoordinates = { latitude: 35.6762, longitude: 139.6503 };
  }

  async validateUserLocation(
    params: ValidateLocationParams,
  ): Promise<Result<boolean, LocationServiceError>> {
    if (this.shouldFail) {
      return err(new LocationServiceError("Mock validation failed"));
    }

    // Simulate validation logic based on distance
    const isValid = this.mockDistance <= params.maxDistanceMeters;
    return ok(this.mockValidationResult && isValid);
  }

  async calculateDistance(
    _from: Coordinates,
    _to: Coordinates,
  ): Promise<Result<number, LocationServiceError>> {
    if (this.shouldFail) {
      return err(new LocationServiceError("Mock distance calculation failed"));
    }

    return ok(this.mockDistance);
  }

  async isWithinRadius(
    _center: Coordinates,
    _point: Coordinates,
    radiusMeters: number,
  ): Promise<Result<boolean, LocationServiceError>> {
    if (this.shouldFail) {
      return err(new LocationServiceError("Mock radius check failed"));
    }

    const isWithin = this.mockDistance <= radiusMeters;
    return ok(isWithin);
  }

  async getAddressFromCoordinates(
    _coordinates: Coordinates,
  ): Promise<Result<string, LocationServiceError>> {
    if (this.shouldFail) {
      return err(new LocationServiceError("Mock reverse geocoding failed"));
    }

    return ok(this.mockAddress);
  }

  async getCoordinatesFromAddress(
    address: string,
  ): Promise<Result<Coordinates | null, LocationServiceError>> {
    if (this.shouldFail) {
      return err(new LocationServiceError("Mock forward geocoding failed"));
    }

    if (!address.trim()) {
      return ok(null);
    }

    return ok(this.mockCoordinates);
  }
}
