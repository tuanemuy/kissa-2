import { err, ok, type Result } from "neverthrow";
import type {
  PinRegionParams,
  RegionPin,
  RegionWithStats,
  ReorderPinnedRegionsParams,
} from "@/core/domain/region/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class RegionPinApplicationError extends AnyError {
  override readonly name = "RegionPinApplicationError";
}

/**
 * Pin a region for easy access
 */
export async function pinRegion(
  context: Context,
  params: PinRegionParams,
): Promise<Result<RegionPin, RegionPinApplicationError>> {
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(params.userId) || !uuidRegex.test(params.regionId)) {
    return err(
      new RegionPinApplicationError(
        "Invalid UUID format",
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  // Check if region exists
  const regionResult = await context.regionRepository.findById(params.regionId);
  if (regionResult.isErr()) {
    return err(
      new RegionPinApplicationError(
        "Failed to verify region existence",
        ERROR_CODES.INTERNAL_ERROR,
        regionResult.error,
      ),
    );
  }

  if (!regionResult.value) {
    return err(
      new RegionPinApplicationError(
        "Region not found",
        ERROR_CODES.REGION_NOT_FOUND,
      ),
    );
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
        ERROR_CODES.INTERNAL_ERROR,
        existingPinResult.error,
      ),
    );
  }

  if (existingPinResult.value) {
    return err(
      new RegionPinApplicationError(
        "Region is already pinned",
        ERROR_CODES.ALREADY_EXISTS,
      ),
    );
  }

  // Pin the region
  const pinResult = await context.regionPinRepository.add(params);
  if (pinResult.isErr()) {
    return err(
      new RegionPinApplicationError(
        "Failed to pin region",
        ERROR_CODES.INTERNAL_ERROR,
        pinResult.error,
      ),
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
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId) || !uuidRegex.test(regionId)) {
    return err(
      new RegionPinApplicationError(
        "Invalid UUID format",
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  // Check if pinned
  const existingPinResult =
    await context.regionPinRepository.findByUserAndRegion(userId, regionId);
  if (existingPinResult.isErr()) {
    return err(
      new RegionPinApplicationError(
        "Failed to check existing pin",
        ERROR_CODES.INTERNAL_ERROR,
        existingPinResult.error,
      ),
    );
  }

  if (!existingPinResult.value) {
    return err(
      new RegionPinApplicationError(
        "Region is not pinned",
        ERROR_CODES.NOT_FOUND,
      ),
    );
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
        ERROR_CODES.INTERNAL_ERROR,
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
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return err(
      new RegionPinApplicationError(
        "Invalid UUID format",
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  const result = await context.regionPinRepository.getRegionsWithPins(userId);
  if (result.isErr()) {
    return err(
      new RegionPinApplicationError(
        "Failed to get pinned regions",
        ERROR_CODES.INTERNAL_ERROR,
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
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return err(
      new RegionPinApplicationError(
        "Invalid UUID format",
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  const result = await context.regionPinRepository.findByUser(userId);
  if (result.isErr()) {
    return err(
      new RegionPinApplicationError(
        "Failed to get pin list",
        ERROR_CODES.INTERNAL_ERROR,
        result.error,
      ),
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
        ERROR_CODES.INTERNAL_ERROR,
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
          ERROR_CODES.NOT_FOUND,
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
        ERROR_CODES.INTERNAL_ERROR,
        reorderResult.error,
      ),
    );
  }

  return ok(undefined);
}
