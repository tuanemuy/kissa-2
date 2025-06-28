import { err, ok, type Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class DeletePlaceError extends AnyError {
  override readonly name = "DeletePlaceError";
}

export interface DeletePlaceRequest {
  placeId: string;
  userId: string;
}

/**
 * Deletes an existing place
 *
 * Business rules:
 * - Only the place creator or users with delete permission can delete the place
 * - Place must exist and be accessible
 * - Cannot delete place that has active check-ins
 * - Region place count is updated after deletion
 */
export async function deletePlace(
  context: Context,
  request: DeletePlaceRequest,
): Promise<Result<void, DeletePlaceError>> {
  try {
    const { placeId, userId } = request;

    // Check if user has permission to delete this place
    const deletePermissionResult =
      await context.placeRepository.checkDeletePermission(placeId, userId);

    if (deletePermissionResult.isErr()) {
      return err(
        new DeletePlaceError(
          "Failed to check place delete permission",
          ERROR_CODES.PLACE_NOT_FOUND,
          deletePermissionResult.error,
        ),
      );
    }

    if (!deletePermissionResult.value) {
      return err(
        new DeletePlaceError(
          "You don't have permission to delete this place",
          ERROR_CODES.PLACE_DELETE_PERMISSION_REQUIRED,
        ),
      );
    }

    // Get place details to check for dependencies
    const placeResult = await context.placeRepository.findById(placeId);
    if (placeResult.isErr()) {
      return err(
        new DeletePlaceError(
          "Failed to find place",
          ERROR_CODES.PLACE_NOT_FOUND,
          placeResult.error,
        ),
      );
    }

    const place = placeResult.value;
    if (!place) {
      return err(
        new DeletePlaceError("Place not found", ERROR_CODES.PLACE_NOT_FOUND),
      );
    }

    // Check if place has active check-ins
    const checkinsResult = await context.checkinRepository.getByPlace(
      placeId,
      1,
    );

    if (checkinsResult.isErr()) {
      return err(
        new DeletePlaceError(
          "Failed to check place dependencies",
          ERROR_CODES.INTERNAL_ERROR,
          checkinsResult.error,
        ),
      );
    }

    // Check if there are any active check-ins
    const hasActiveCheckins = checkinsResult.value.some(
      (checkin) => checkin.status === "active",
    );

    if (hasActiveCheckins) {
      return err(
        new DeletePlaceError(
          "Cannot delete place that has active check-ins",
          ERROR_CODES.CONTENT_HAS_DEPENDENCIES,
        ),
      );
    }

    // Delete the place
    const deleteResult = await context.placeRepository.delete(placeId);

    if (deleteResult.isErr()) {
      return err(
        new DeletePlaceError(
          "Failed to delete place",
          ERROR_CODES.PLACE_DELETE_FAILED,
          deleteResult.error,
        ),
      );
    }

    // Update region place count
    await context.regionRepository.updatePlaceCount(place.regionId);

    return ok(undefined);
  } catch (error) {
    return err(
      new DeletePlaceError(
        "Unexpected error while deleting place",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
