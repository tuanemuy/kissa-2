import { err, ok, type Result } from "neverthrow";
import type {
  AddRegionToFavoritesParams,
  RegionFavorite,
  RegionWithStats,
} from "@/core/domain/region/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class RegionFavoriteApplicationError extends AnyError {
  override readonly name = "RegionFavoriteApplicationError";
}

/**
 * Add a region to user's favorites
 */
export async function addRegionToFavorites(
  context: Context,
  params: AddRegionToFavoritesParams,
): Promise<Result<RegionFavorite, RegionFavoriteApplicationError>> {
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(params.userId) || !uuidRegex.test(params.regionId)) {
    return err(
      new RegionFavoriteApplicationError(
        "Invalid UUID format",
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  // Check if region exists
  const regionResult = await context.regionRepository.findById(params.regionId);
  if (regionResult.isErr()) {
    return err(
      new RegionFavoriteApplicationError(
        "Failed to verify region existence",
        ERROR_CODES.INTERNAL_ERROR,
        regionResult.error,
      ),
    );
  }

  if (!regionResult.value) {
    return err(
      new RegionFavoriteApplicationError(
        "Region not found",
        ERROR_CODES.REGION_NOT_FOUND,
      ),
    );
  }

  // Check if already favorited
  const existingFavoriteResult =
    await context.regionFavoriteRepository.findByUserAndRegion(
      params.userId,
      params.regionId,
    );
  if (existingFavoriteResult.isErr()) {
    return err(
      new RegionFavoriteApplicationError(
        "Failed to check existing favorite",
        ERROR_CODES.INTERNAL_ERROR,
        existingFavoriteResult.error,
      ),
    );
  }

  if (existingFavoriteResult.value) {
    return err(
      new RegionFavoriteApplicationError(
        "Region is already favorited",
        ERROR_CODES.ALREADY_EXISTS,
      ),
    );
  }

  // Add to favorites
  const addResult = await context.regionFavoriteRepository.add(params);
  if (addResult.isErr()) {
    return err(
      new RegionFavoriteApplicationError(
        "Failed to add region to favorites",
        ERROR_CODES.INTERNAL_ERROR,
        addResult.error,
      ),
    );
  }

  return ok(addResult.value);
}

/**
 * Remove a region from user's favorites
 */
export async function removeRegionFromFavorites(
  context: Context,
  userId: string,
  regionId: string,
): Promise<Result<void, RegionFavoriteApplicationError>> {
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId) || !uuidRegex.test(regionId)) {
    return err(
      new RegionFavoriteApplicationError(
        "Invalid UUID format",
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  // Check if favorited
  const existingFavoriteResult =
    await context.regionFavoriteRepository.findByUserAndRegion(
      userId,
      regionId,
    );
  if (existingFavoriteResult.isErr()) {
    return err(
      new RegionFavoriteApplicationError(
        "Failed to check existing favorite",
        ERROR_CODES.INTERNAL_ERROR,
        existingFavoriteResult.error,
      ),
    );
  }

  if (!existingFavoriteResult.value) {
    return err(
      new RegionFavoriteApplicationError(
        "Region is not favorited",
        ERROR_CODES.NOT_FOUND,
      ),
    );
  }

  // Remove from favorites
  const removeResult = await context.regionFavoriteRepository.remove(
    userId,
    regionId,
  );
  if (removeResult.isErr()) {
    return err(
      new RegionFavoriteApplicationError(
        "Failed to remove region from favorites",
        ERROR_CODES.INTERNAL_ERROR,
        removeResult.error,
      ),
    );
  }

  return ok(undefined);
}

/**
 * Get user's favorite regions
 */
export async function getUserFavoriteRegions(
  context: Context,
  userId: string,
  limit?: number,
): Promise<Result<RegionWithStats[], RegionFavoriteApplicationError>> {
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return err(
      new RegionFavoriteApplicationError(
        "Invalid UUID format",
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  const result = await context.regionFavoriteRepository.getRegionsWithFavorites(
    userId,
    limit,
  );
  if (result.isErr()) {
    return err(
      new RegionFavoriteApplicationError(
        "Failed to get favorite regions",
        ERROR_CODES.INTERNAL_ERROR,
        result.error,
      ),
    );
  }

  return ok(result.value);
}

/**
 * Get user's favorite region list (metadata only)
 */
export async function getUserFavoriteList(
  context: Context,
  userId: string,
): Promise<Result<RegionFavorite[], RegionFavoriteApplicationError>> {
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return err(
      new RegionFavoriteApplicationError(
        "Invalid UUID format",
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  const result = await context.regionFavoriteRepository.findByUser(userId);
  if (result.isErr()) {
    return err(
      new RegionFavoriteApplicationError(
        "Failed to get favorite list",
        ERROR_CODES.INTERNAL_ERROR,
        result.error,
      ),
    );
  }

  return ok(result.value);
}
