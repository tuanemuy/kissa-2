import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Place } from "@/core/domain/place/types";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ADMIN_ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class AdminContentManagementError extends AnyError {
  override readonly name: string = "AdminContentManagementError";

  constructor(message: string, cause?: unknown) {
    super(message, ADMIN_ERROR_CODES.ADMIN_PERMISSION_REQUIRED, cause);
  }
}

export const updatePlaceStatusInputSchema = z.object({
  placeId: z.string().uuid(),
  status: z.enum(["draft", "published", "archived"]),
  reason: z.string().min(1).max(500).optional(),
});
export type UpdatePlaceStatusInput = z.infer<
  typeof updatePlaceStatusInputSchema
>;

export const updateRegionStatusInputSchema = z.object({
  regionId: z.string().uuid(),
  status: z.enum(["draft", "published", "archived"]),
  reason: z.string().min(1).max(500).optional(),
});
export type UpdateRegionStatusInput = z.infer<
  typeof updateRegionStatusInputSchema
>;

export const adminContentListInputSchema = z.object({
  pagination: z
    .object({
      page: z.number().int().min(1).default(1),
      size: z.number().int().min(1).max(100).default(20),
    })
    .default({ page: 1, size: 20 }),
  filter: z
    .object({
      status: z.enum(["draft", "published", "archived"]).optional(),
      createdBy: z.string().uuid().optional(),
      keyword: z.string().optional(),
    })
    .optional(),
});
export type AdminContentListInput = z.infer<typeof adminContentListInputSchema>;

/**
 * Check if the requesting user has admin privileges
 */
async function checkAdminPermissions(
  context: Context,
  adminUserId: string,
): Promise<Result<User, AdminContentManagementError>> {
  const adminResult = await context.userRepository.findById(adminUserId);
  if (adminResult.isErr()) {
    return err(
      new AdminContentManagementError(
        "Admin user not found",
        adminResult.error,
      ),
    );
  }

  const admin = adminResult.value;
  if (!admin) {
    return err(new AdminContentManagementError("Admin user not found"));
  }

  if (admin.role !== "admin") {
    return err(
      new AdminContentManagementError(
        "Insufficient permissions: admin role required",
      ),
    );
  }

  if (admin.status !== "active") {
    return err(new AdminContentManagementError("Admin account is not active"));
  }

  return ok(admin);
}

/**
 * Update place status (admin only)
 */
export async function adminUpdatePlaceStatus(
  context: Context,
  adminUserId: string,
  input: UpdatePlaceStatusInput,
): Promise<Result<Place, AdminContentManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Verify place exists
    const placeResult = await context.placeRepository.findById(input.placeId);
    if (placeResult.isErr()) {
      return err(
        new AdminContentManagementError(
          "Failed to find place",
          placeResult.error,
        ),
      );
    }

    const place = placeResult.value;
    if (!place) {
      return err(new AdminContentManagementError("Place not found"));
    }

    // Update place status
    const updateResult = await context.placeRepository.updateStatus(
      input.placeId,
      input.status,
    );
    if (updateResult.isErr()) {
      return err(
        new AdminContentManagementError(
          "Failed to update place status",
          updateResult.error,
        ),
      );
    }

    if (updateResult.isErr()) {
      return err(
        new AdminContentManagementError(
          "Failed to update place status",
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new AdminContentManagementError(
        "Unexpected error during place status update",
        error,
      ),
    );
  }
}

/**
 * Update region status (admin only)
 */
export async function adminUpdateRegionStatus(
  context: Context,
  adminUserId: string,
  input: UpdateRegionStatusInput,
): Promise<Result<Region, AdminContentManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Verify region exists
    const regionResult = await context.regionRepository.findById(
      input.regionId,
    );
    if (regionResult.isErr()) {
      return err(
        new AdminContentManagementError(
          "Failed to find region",
          regionResult.error,
        ),
      );
    }

    const region = regionResult.value;
    if (!region) {
      return err(new AdminContentManagementError("Region not found"));
    }

    // Update region status
    const updateResult = await context.regionRepository.updateStatus(
      input.regionId,
      input.status,
    );
    if (updateResult.isErr()) {
      return err(
        new AdminContentManagementError(
          "Failed to update region status",
          updateResult.error,
        ),
      );
    }

    if (updateResult.isErr()) {
      return err(
        new AdminContentManagementError(
          "Failed to update region status",
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new AdminContentManagementError(
        "Unexpected error during region status update",
        error,
      ),
    );
  }
}

/**
 * Delete place (admin only)
 */
export async function adminDeletePlace(
  context: Context,
  adminUserId: string,
  placeId: string,
  _reason?: string,
): Promise<Result<void, AdminContentManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Verify place exists
    const placeResult = await context.placeRepository.findById(placeId);
    if (placeResult.isErr()) {
      return err(
        new AdminContentManagementError(
          "Failed to find place",
          placeResult.error,
        ),
      );
    }

    const place = placeResult.value;
    if (!place) {
      return err(new AdminContentManagementError("Place not found"));
    }

    // Delete place
    const deleteResult = await context.placeRepository.delete(placeId);
    if (deleteResult.isErr()) {
      return err(
        new AdminContentManagementError(
          "Failed to delete place",
          deleteResult.error,
        ),
      );
    }

    if (deleteResult.isErr()) {
      return err(
        new AdminContentManagementError(
          "Failed to delete place",
          deleteResult.error,
        ),
      );
    }

    return ok(deleteResult.value);
  } catch (error) {
    return err(
      new AdminContentManagementError(
        "Unexpected error during place deletion",
        error,
      ),
    );
  }
}

/**
 * Delete region (admin only)
 */
export async function adminDeleteRegion(
  context: Context,
  adminUserId: string,
  regionId: string,
  _reason?: string,
): Promise<Result<void, AdminContentManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Verify region exists
    const regionResult = await context.regionRepository.findById(regionId);
    if (regionResult.isErr()) {
      return err(
        new AdminContentManagementError(
          "Failed to find region",
          regionResult.error,
        ),
      );
    }

    const region = regionResult.value;
    if (!region) {
      return err(new AdminContentManagementError("Region not found"));
    }

    // Check if region has places
    const placesResult = await context.placeRepository.list({
      pagination: {
        page: 1,
        limit: 1,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      filter: { regionId },
    });

    if (placesResult.isOk() && placesResult.value.count > 0) {
      return err(
        new AdminContentManagementError(
          "Cannot delete region with existing places",
        ),
      );
    }

    // Delete region
    const deleteResult = await context.regionRepository.delete(regionId);
    if (deleteResult.isErr()) {
      return err(
        new AdminContentManagementError(
          "Failed to delete region",
          deleteResult.error,
        ),
      );
    }

    if (deleteResult.isErr()) {
      return err(
        new AdminContentManagementError(
          "Failed to delete region",
          deleteResult.error,
        ),
      );
    }

    return ok(deleteResult.value);
  } catch (error) {
    return err(
      new AdminContentManagementError(
        "Unexpected error during region deletion",
        error,
      ),
    );
  }
}

/**
 * Get content statistics for admin dashboard
 */
export async function getContentStatistics(
  context: Context,
  adminUserId: string,
): Promise<
  Result<
    {
      users: { total: number; active: number; suspended: number };
      regions: { total: number; published: number };
      places: { total: number; published: number };
    },
    AdminContentManagementError
  >
> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Get user statistics
    const allUsersResult = await context.userRepository.list({
      pagination: {
        page: 1,
        limit: 1,
        order: "desc" as const,
        orderBy: "createdAt",
      },
    });

    const activeUsersResult = await context.userRepository.list({
      pagination: {
        page: 1,
        limit: 1,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      filter: { status: "active" },
    });

    const suspendedUsersResult = await context.userRepository.list({
      pagination: {
        page: 1,
        limit: 1,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      filter: { status: "suspended" },
    });

    // Get content statistics
    const allRegionsResult = await context.regionRepository.list({
      pagination: {
        page: 1,
        limit: 1,
        order: "desc" as const,
        orderBy: "createdAt",
      },
    });

    const publishedRegionsResult = await context.regionRepository.list({
      pagination: {
        page: 1,
        limit: 1,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      filter: { status: "published" },
    });

    const allPlacesResult = await context.placeRepository.list({
      pagination: {
        page: 1,
        limit: 1,
        order: "desc" as const,
        orderBy: "createdAt",
      },
    });

    const publishedPlacesResult = await context.placeRepository.list({
      pagination: {
        page: 1,
        limit: 1,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      filter: { status: "published" },
    });

    return ok({
      users: {
        total: allUsersResult.isOk() ? allUsersResult.value.count : 0,
        active: activeUsersResult.isOk() ? activeUsersResult.value.count : 0,
        suspended: suspendedUsersResult.isOk()
          ? suspendedUsersResult.value.count
          : 0,
      },
      regions: {
        total: allRegionsResult.isOk() ? allRegionsResult.value.count : 0,
        published: publishedRegionsResult.isOk()
          ? publishedRegionsResult.value.count
          : 0,
      },
      places: {
        total: allPlacesResult.isOk() ? allPlacesResult.value.count : 0,
        published: publishedPlacesResult.isOk()
          ? publishedPlacesResult.value.count
          : 0,
      },
    });
  } catch (error) {
    return err(
      new AdminContentManagementError(
        "Unexpected error getting content statistics",
        error,
      ),
    );
  }
}
