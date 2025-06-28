import { err, ok, type Result } from "neverthrow";
import type { Place, UpdatePlaceParams } from "@/core/domain/place/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class UpdatePlaceError extends AnyError {
  override readonly name = "UpdatePlaceError";
}

export interface UpdatePlaceRequest {
  placeId: string;
  userId: string;
  params: UpdatePlaceParams;
}

/**
 * Updates an existing place
 *
 * Business rules:
 * - Only the place creator or users with edit permission can update the place
 * - Place must exist and be accessible
 * - Updated data must be valid
 * - Region place count is updated if region changes
 */
export async function updatePlace(
  context: Context,
  request: UpdatePlaceRequest,
): Promise<Result<Place, UpdatePlaceError>> {
  try {
    const { placeId, userId, params } = request;

    // Check if user has permission to edit this place
    const editPermissionResult =
      await context.placeRepository.checkEditPermission(placeId, userId);

    if (editPermissionResult.isErr()) {
      return err(
        new UpdatePlaceError(
          "Failed to check place edit permission",
          ERROR_CODES.PLACE_NOT_FOUND,
          editPermissionResult.error,
        ),
      );
    }

    if (!editPermissionResult.value) {
      return err(
        new UpdatePlaceError(
          "You don't have permission to edit this place",
          ERROR_CODES.PLACE_EDIT_PERMISSION_REQUIRED,
        ),
      );
    }

    // Get current place to check for region changes
    const currentPlaceResult = await context.placeRepository.findById(placeId);
    if (currentPlaceResult.isErr()) {
      return err(
        new UpdatePlaceError(
          "Failed to find current place",
          ERROR_CODES.PLACE_NOT_FOUND,
          currentPlaceResult.error,
        ),
      );
    }

    const currentPlace = currentPlaceResult.value;
    if (!currentPlace) {
      return err(
        new UpdatePlaceError("Place not found", ERROR_CODES.PLACE_NOT_FOUND),
      );
    }

    // Update the place
    const updateResult = await context.placeRepository.update(placeId, params);

    if (updateResult.isErr()) {
      return err(
        new UpdatePlaceError(
          "Failed to update place",
          ERROR_CODES.PLACE_UPDATE_FAILED,
          updateResult.error,
        ),
      );
    }

    const updatedPlace = updateResult.value;

    // Update region place count if region changed
    // Note: This is a simplified approach. In a real implementation,
    // we would need to handle this more carefully with transactions
    if (currentPlace.regionId !== updatedPlace.regionId) {
      // Update old region count (decrement)
      await context.regionRepository.updatePlaceCount(currentPlace.regionId);
      // Update new region count (increment)
      await context.regionRepository.updatePlaceCount(updatedPlace.regionId);
    }

    return ok(updatedPlace);
  } catch (error) {
    return err(
      new UpdatePlaceError(
        "Unexpected error while updating place",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
