import { err, ok, type Result } from "neverthrow";
import type {
  AddRegionToFavoritesParams,
  RegionFavorite,
  RegionWithStats,
} from "@/core/domain/region/types";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class RegionFavoriteApplicationError extends AnyError {
  override readonly name = "RegionFavoriteApplicationError";

  constructor(message: string, cause?: unknown) {
    super(message, undefined, cause);
  }
}

/**
 * Add a region to user's favorites
 */
export async function addRegionToFavorites(
  context: Context,
  params: AddRegionToFavoritesParams,
): Promise<Result<RegionFavorite, RegionFavoriteApplicationError>> {
  // Check if region exists
  const regionResult = await context.regionRepository.findById(params.regionId);
  if (regionResult.isErr()) {
    return err(
      new RegionFavoriteApplicationError(
        "Failed to verify region existence",
        regionResult.error,
      ),
    );
  }

  if (!regionResult.value) {
    return err(new RegionFavoriteApplicationError("Region not found"));
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
        existingFavoriteResult.error,
      ),
    );
  }

  if (existingFavoriteResult.value) {
    return err(
      new RegionFavoriteApplicationError("Region is already favorited"),
    );
  }

  // Add to favorites
  const addResult = await context.regionFavoriteRepository.add(params);
  if (addResult.isErr()) {
    return err(
      new RegionFavoriteApplicationError(
        "Failed to add region to favorites",
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
        existingFavoriteResult.error,
      ),
    );
  }

  if (!existingFavoriteResult.value) {
    return err(new RegionFavoriteApplicationError("Region is not favorited"));
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
  const result = await context.regionFavoriteRepository.getRegionsWithFavorites(
    userId,
    limit,
  );
  if (result.isErr()) {
    return err(
      new RegionFavoriteApplicationError(
        "Failed to get favorite regions",
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
  const result = await context.regionFavoriteRepository.findByUser(userId);
  if (result.isErr()) {
    return err(
      new RegionFavoriteApplicationError(
        "Failed to get favorite list",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
