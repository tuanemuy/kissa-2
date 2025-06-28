import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import type { Coordinates } from "../../region/types";
import type { ValidateLocationParams } from "../types";

export class LocationServiceError extends AnyError {
  override readonly name = "LocationServiceError";

  constructor(message: string, cause?: unknown) {
    super(message, undefined, cause);
  }
}

export interface LocationService {
  validateUserLocation(
    params: ValidateLocationParams,
  ): Promise<Result<boolean, LocationServiceError>>;

  calculateDistance(
    from: Coordinates,
    to: Coordinates,
  ): Promise<Result<number, LocationServiceError>>;

  isWithinRadius(
    center: Coordinates,
    point: Coordinates,
    radiusMeters: number,
  ): Promise<Result<boolean, LocationServiceError>>;

  getAddressFromCoordinates(
    coordinates: Coordinates,
  ): Promise<Result<string, LocationServiceError>>;

  getCoordinatesFromAddress(
    address: string,
  ): Promise<Result<Coordinates | null, LocationServiceError>>;
}
