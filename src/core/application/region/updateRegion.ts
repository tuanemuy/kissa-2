import { err, ok, type Result } from "neverthrow";
import type { Region, UpdateRegionParams } from "@/core/domain/region/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class UpdateRegionError extends AnyError {
  override readonly name = "UpdateRegionError";
}

export interface UpdateRegionRequest {
  regionId: string;
  userId: string;
  params: UpdateRegionParams;
}

/**
 * Updates an existing region
 *
 * Business rules:
 * - Only the region creator can update the region
 * - Region must exist and be accessible
 * - Updated data must be valid
 */
export async function updateRegion(
  context: Context,
  request: UpdateRegionRequest,
): Promise<Result<Region, UpdateRegionError>> {
  try {
    const { regionId, userId, params } = request;

    // Check if user has permission to update this region
    const ownershipResult = await context.regionRepository.checkOwnership(
      regionId,
      userId,
    );

    if (ownershipResult.isErr()) {
      return err(
        new UpdateRegionError(
          "Failed to check region ownership",
          ERROR_CODES.REGION_NOT_FOUND,
          ownershipResult.error,
        ),
      );
    }

    if (!ownershipResult.value) {
      return err(
        new UpdateRegionError(
          "You don't have permission to update this region",
          ERROR_CODES.REGION_ACCESS_DENIED,
        ),
      );
    }

    // Update the region
    const updateResult = await context.regionRepository.update(
      regionId,
      params,
    );

    if (updateResult.isErr()) {
      return err(
        new UpdateRegionError(
          "Failed to update region",
          ERROR_CODES.REGION_UPDATE_FAILED,
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new UpdateRegionError(
        "Unexpected error while updating region",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
