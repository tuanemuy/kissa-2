import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { ListUsersQuery, User } from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class AdminUserManagementError extends AnyError {
  override readonly name = "AdminUserManagementError";
}

export const updateUserRoleInputSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["visitor", "editor", "admin"]),
  reason: z.string().min(1).max(500).optional(),
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleInputSchema>;

export const updateUserStatusInputSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "suspended", "deleted"]),
  reason: z.string().min(1).max(500).optional(),
});
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusInputSchema>;

export const adminListUsersInputSchema = z.object({
  pagination: z
    .object({
      page: z.number().int().min(1).default(1),
      size: z.number().int().min(1).max(100).default(20),
    })
    .default({ page: 1, size: 20 }),
  filter: z
    .object({
      role: z.enum(["visitor", "editor", "admin"]).optional(),
      status: z.enum(["active", "suspended", "deleted"]).optional(),
      keyword: z.string().optional(),
    })
    .optional(),
});
export type AdminListUsersInput = z.infer<typeof adminListUsersInputSchema>;

/**
 * Check if the requesting user has admin privileges
 */
async function checkAdminPermissions(
  context: Context,
  adminUserId: string,
): Promise<Result<User, AdminUserManagementError>> {
  const adminResult = await context.userRepository.findById(adminUserId);
  if (adminResult.isErr()) {
    return err(
      new AdminUserManagementError(
        "Failed to find admin user",
        ERROR_CODES.INTERNAL_ERROR,
        adminResult.error,
      ),
    );
  }

  const admin = adminResult.value;
  if (!admin) {
    return err(
      new AdminUserManagementError(
        "Admin user not found",
        ERROR_CODES.USER_NOT_FOUND,
      ),
    );
  }

  if (admin.role !== "admin") {
    return err(
      new AdminUserManagementError(
        "Insufficient permissions: admin role required",
        ERROR_CODES.ADMIN_PERMISSION_REQUIRED,
      ),
    );
  }

  if (admin.status !== "active") {
    return err(
      new AdminUserManagementError(
        "Admin account is not active",
        ERROR_CODES.USER_INACTIVE,
      ),
    );
  }

  return ok(admin);
}

/**
 * List all users with admin-level details
 */
export async function adminListUsers(
  context: Context,
  adminUserId: string,
  input: AdminListUsersInput,
): Promise<Result<{ items: User[]; count: number }, AdminUserManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Build query
    const query: ListUsersQuery = {
      pagination: {
        page: input.pagination.page,
        limit: input.pagination.size,
        order: "desc",
        orderBy: "createdAt",
      },
      filter: input.filter,
    };

    // List users
    const usersResult = await context.userRepository.list(query);
    if (usersResult.isErr()) {
      return err(
        new AdminUserManagementError(
          "Failed to list users",
          ERROR_CODES.QUERY_FAILED,
          usersResult.error,
        ),
      );
    }

    return ok(usersResult.value);
  } catch (error) {
    return err(
      new AdminUserManagementError(
        "Unexpected error during user listing",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Update a user's role
 */
export async function updateUserRole(
  context: Context,
  adminUserId: string,
  input: UpdateUserRoleInput,
): Promise<Result<User, AdminUserManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Prevent admin from changing their own role
    if (adminUserId === input.userId) {
      return err(
        new AdminUserManagementError(
          "Cannot change your own role",
          ERROR_CODES.CANNOT_MODIFY_SELF,
        ),
      );
    }

    // Verify target user exists
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(
        new AdminUserManagementError(
          "Failed to find target user",
          ERROR_CODES.QUERY_FAILED,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(new AdminUserManagementError("Target user not found"));
    }

    // Update user role
    const updateResult = await context.userRepository.updateRole(
      input.userId,
      input.role,
    );
    if (updateResult.isErr()) {
      return err(
        new AdminUserManagementError(
          "Failed to update user role",
          ERROR_CODES.QUERY_FAILED,
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new AdminUserManagementError(
        "Unexpected error during role update",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Update a user's status (suspend, activate, etc.)
 */
export async function updateUserStatus(
  context: Context,
  adminUserId: string,
  input: UpdateUserStatusInput,
): Promise<Result<User, AdminUserManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Prevent admin from changing their own status
    if (adminUserId === input.userId) {
      return err(new AdminUserManagementError("Cannot change your own status"));
    }

    // Verify target user exists
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(
        new AdminUserManagementError(
          "Failed to find target user",
          ERROR_CODES.QUERY_FAILED,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(new AdminUserManagementError("Target user not found"));
    }

    // Update user status
    const updateResult = await context.userRepository.updateStatus(
      input.userId,
      input.status,
    );
    if (updateResult.isErr()) {
      return err(
        new AdminUserManagementError(
          "Failed to update user status",
          ERROR_CODES.QUERY_FAILED,
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new AdminUserManagementError(
        "Unexpected error during status update",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Delete a user account (admin only)
 */
export async function deleteUser(
  context: Context,
  adminUserId: string,
  targetUserId: string,
  _reason?: string,
): Promise<Result<void, AdminUserManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Prevent admin from deleting their own account
    if (adminUserId === targetUserId) {
      return err(
        new AdminUserManagementError("Cannot delete your own account"),
      );
    }

    // Verify target user exists
    const userResult = await context.userRepository.findById(targetUserId);
    if (userResult.isErr()) {
      return err(
        new AdminUserManagementError(
          "Failed to find target user",
          ERROR_CODES.QUERY_FAILED,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(new AdminUserManagementError("Target user not found"));
    }

    // Delete user
    const deleteResult = await context.userRepository.delete(targetUserId);
    if (deleteResult.isErr()) {
      return err(
        new AdminUserManagementError(
          "Failed to delete user",
          ERROR_CODES.QUERY_FAILED,
          deleteResult.error,
        ),
      );
    }

    return ok(deleteResult.value);
  } catch (error) {
    return err(
      new AdminUserManagementError(
        "Unexpected error during user deletion",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
