import { err, ok, type Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class DeleteRegionError extends AnyError {
  override readonly name = "DeleteRegionError";
}

export interface DeleteRegionRequest {
  regionId: string;
  userId: string;
}

/**
 * Deletes an existing region
 *
 * Business rules:
 * - Only the region creator or admin can delete the region
 * - Region must exist and be accessible
 * - Region cannot be deleted if it has published places
 */
export async function deleteRegion(
  context: Context,
  request: DeleteRegionRequest,
): Promise<Result<void, DeleteRegionError>> {
  try {
    const { regionId, userId } = request;

    // Check if user has permission to delete this region
    const ownershipResult = await context.regionRepository.checkOwnership(
      regionId,
      userId,
    );

    if (ownershipResult.isErr()) {
      return err(
        new DeleteRegionError(
          "Failed to check region ownership",
          ERROR_CODES.REGION_NOT_FOUND,
          ownershipResult.error,
        ),
      );
    }

    if (!ownershipResult.value) {
      return err(
        new DeleteRegionError(
          "You don't have permission to delete this region",
          ERROR_CODES.REGION_ACCESS_DENIED,
        ),
      );
    }

    // Check if region has places
    const placesResult = await context.placeRepository.getByRegion(regionId);

    if (placesResult.isErr()) {
      return err(
        new DeleteRegionError(
          "Failed to check region dependencies",
          ERROR_CODES.INTERNAL_ERROR,
          placesResult.error,
        ),
      );
    }

    // Check if there are any published places in this region
    const hasPublishedPlaces = placesResult.value.some(
      (place) => place.status === "published",
    );

    if (hasPublishedPlaces) {
      return err(
        new DeleteRegionError(
          "Cannot delete region that contains published places",
          ERROR_CODES.REGION_HAS_PLACES,
        ),
      );
    }

    // Delete the region
    const deleteResult = await context.regionRepository.delete(regionId);

    if (deleteResult.isErr()) {
      return err(
        new DeleteRegionError(
          "Failed to delete region",
          ERROR_CODES.REGION_DELETE_FAILED,
          deleteResult.error,
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      new DeleteRegionError(
        "Unexpected error while deleting region",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
