import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import { EXTERNAL_SERVICE_ERROR_CODES } from "@/lib/errorCodes";
import type { Coordinates } from "../../region/types";
import type { ValidateLocationParams } from "../types";

export class LocationServiceError extends AnyError {
  override readonly name: string = "LocationServiceError";

  constructor(message: string, cause?: unknown) {
    super(message, EXTERNAL_SERVICE_ERROR_CODES.LOCATION_SERVICE_FAILED, cause);
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
