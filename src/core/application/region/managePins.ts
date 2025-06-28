import { err, ok, type Result } from "neverthrow";
import type {
  PinRegionParams,
  RegionPin,
  RegionWithStats,
  ReorderPinnedRegionsParams,
} from "@/core/domain/region/types";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class RegionPinApplicationError extends AnyError {
  override readonly name = "RegionPinApplicationError";

  constructor(message: string, cause?: unknown) {
    super(message, undefined, cause);
  }
}

/**
 * Pin a region for easy access
 */
export async function pinRegion(
  context: Context,
  params: PinRegionParams,
): Promise<Result<RegionPin, RegionPinApplicationError>> {
  // Check if region exists
  const regionResult = await context.regionRepository.findById(params.regionId);
  if (regionResult.isErr()) {
    return err(
      new RegionPinApplicationError(
        "Failed to verify region existence",
        regionResult.error,
      ),
    );
  }

  if (!regionResult.value) {
    return err(new RegionPinApplicationError("Region not found"));
  }

  // Check if already pinned
  const existingPinResult =
    await context.regionPinRepository.findByUserAndRegion(
      params.userId,
      params.regionId,
    );
  if (existingPinResult.isErr()) {
    return err(
      new RegionPinApplicationError(
        "Failed to check existing pin",
        existingPinResult.error,
      ),
    );
  }

  if (existingPinResult.value) {
    return err(new RegionPinApplicationError("Region is already pinned"));
  }

  // Pin the region
  const pinResult = await context.regionPinRepository.add(params);
  if (pinResult.isErr()) {
    return err(
      new RegionPinApplicationError("Failed to pin region", pinResult.error),
    );
  }

  return ok(pinResult.value);
}

/**
 * Unpin a region
 */
export async function unpinRegion(
  context: Context,
  userId: string,
  regionId: string,
): Promise<Result<void, RegionPinApplicationError>> {
  // Check if pinned
  const existingPinResult =
    await context.regionPinRepository.findByUserAndRegion(userId, regionId);
  if (existingPinResult.isErr()) {
    return err(
      new RegionPinApplicationError(
        "Failed to check existing pin",
        existingPinResult.error,
      ),
    );
  }

  if (!existingPinResult.value) {
    return err(new RegionPinApplicationError("Region is not pinned"));
  }

  // Remove pin
  const removeResult = await context.regionPinRepository.remove(
    userId,
    regionId,
  );
  if (removeResult.isErr()) {
    return err(
      new RegionPinApplicationError(
        "Failed to unpin region",
        removeResult.error,
      ),
    );
  }

  return ok(undefined);
}

/**
 * Get user's pinned regions
 */
export async function getUserPinnedRegions(
  context: Context,
  userId: string,
): Promise<Result<RegionWithStats[], RegionPinApplicationError>> {
  const result = await context.regionPinRepository.getRegionsWithPins(userId);
  if (result.isErr()) {
    return err(
      new RegionPinApplicationError(
        "Failed to get pinned regions",
        result.error,
      ),
    );
  }

  return ok(result.value);
}

/**
 * Get user's pin list (metadata only)
 */
export async function getUserPinList(
  context: Context,
  userId: string,
): Promise<Result<RegionPin[], RegionPinApplicationError>> {
  const result = await context.regionPinRepository.findByUser(userId);
  if (result.isErr()) {
    return err(
      new RegionPinApplicationError("Failed to get pin list", result.error),
    );
  }

  return ok(result.value);
}

/**
 * Reorder pinned regions
 */
export async function reorderPinnedRegions(
  context: Context,
  params: ReorderPinnedRegionsParams,
): Promise<Result<void, RegionPinApplicationError>> {
  // Validate that all regions are actually pinned by the user
  const pinnedRegionsResult = await context.regionPinRepository.findByUser(
    params.userId,
  );
  if (pinnedRegionsResult.isErr()) {
    return err(
      new RegionPinApplicationError(
        "Failed to get user's pinned regions",
        pinnedRegionsResult.error,
      ),
    );
  }

  const pinnedRegionIds = new Set(
    pinnedRegionsResult.value.map((pin) => pin.regionId),
  );

  // Check that all regions in the reorder list are actually pinned
  for (const regionId of params.regionIds) {
    if (!pinnedRegionIds.has(regionId)) {
      return err(
        new RegionPinApplicationError(
          `Region ${regionId} is not pinned by user`,
        ),
      );
    }
  }

  // Perform the reorder
  const reorderResult = await context.regionPinRepository.reorder(params);
  if (reorderResult.isErr()) {
    return err(
      new RegionPinApplicationError(
        "Failed to reorder pinned regions",
        reorderResult.error,
      ),
    );
  }

  return ok(undefined);
}
