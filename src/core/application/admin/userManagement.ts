import { z } from "zod/v4";
import { err, ok, type Result } from "neverthrow";
import type { User, UserRole, UserStatus, ListUsersQuery } from "@/core/domain/user/types";
import type { Context } from "../context";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";

export class AdminUserManagementError extends AnyError {
  override readonly name = "AdminUserManagementError";
  
  constructor(message: string, code?: string, cause?: unknown) {
    super(message, code, cause);
  }
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
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    size: z.number().int().min(1).max(100).default(20),
  }).default({ page: 1, size: 20 }),
  filter: z.object({
    role: z.enum(["visitor", "editor", "admin"]).optional(),
    status: z.enum(["active", "suspended", "deleted"]).optional(),
    keyword: z.string().optional(),
  }).optional(),
});
export type AdminListUsersInput = z.infer<typeof adminListUsersInputSchema>;

/**
 * Check if the requesting user has admin privileges
 */
async function checkAdminPermissions(
  context: Context,
  adminUserId: string
): Promise<Result<User, AdminUserManagementError>> {
  const adminResult = await context.userRepository.findById(adminUserId);
  if (adminResult.isErr()) {
    return err(new AdminUserManagementError("Failed to find admin user", ERROR_CODES.INTERNAL_ERROR, adminResult.error));
  }

  const admin = adminResult.value;
  if (!admin) {
    return err(new AdminUserManagementError("Admin user not found", ERROR_CODES.USER_NOT_FOUND));
  }

  if (admin.role !== "admin") {
    return err(new AdminUserManagementError("Insufficient permissions: admin role required", ERROR_CODES.ADMIN_PERMISSION_REQUIRED));
  }

  if (admin.status !== "active") {
    return err(new AdminUserManagementError("Admin account is not active", ERROR_CODES.USER_INACTIVE));
  }

  return ok(admin);
}

/**
 * List all users with admin-level details
 */
export async function adminListUsers(
  context: Context,
  adminUserId: string,
  input: AdminListUsersInput
): Promise<Result<{ items: User[]; count: number }, AdminUserManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Build query
    const query: ListUsersQuery = {
      pagination: input.pagination,
      filter: input.filter,
    };

    // List users
    const usersResult = await context.userRepository.list(query);
    if (usersResult.isErr()) {
      return err(new AdminUserManagementError("Failed to list users", usersResult.error));
    }

    return usersResult;
  } catch (error) {
    return err(new AdminUserManagementError("Unexpected error during user listing", error));
  }
}

/**
 * Update a user's role
 */
export async function updateUserRole(
  context: Context,
  adminUserId: string,
  input: UpdateUserRoleInput
): Promise<Result<User, AdminUserManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Prevent admin from changing their own role
    if (adminUserId === input.userId) {
      return err(new AdminUserManagementError("Cannot change your own role", ERROR_CODES.CANNOT_MODIFY_SELF));
    }

    // Verify target user exists
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(new AdminUserManagementError("Failed to find target user", userResult.error));
    }

    const user = userResult.value;
    if (!user) {
      return err(new AdminUserManagementError("Target user not found"));
    }

    // Update user role
    const updateResult = await context.userRepository.updateRole(input.userId, input.role);
    if (updateResult.isErr()) {
      return err(new AdminUserManagementError("Failed to update user role", updateResult.error));
    }

    return updateResult;
  } catch (error) {
    return err(new AdminUserManagementError("Unexpected error during role update", error));
  }
}

/**
 * Update a user's status (suspend, activate, etc.)
 */
export async function updateUserStatus(
  context: Context,
  adminUserId: string,
  input: UpdateUserStatusInput
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
      return err(new AdminUserManagementError("Failed to find target user", userResult.error));
    }

    const user = userResult.value;
    if (!user) {
      return err(new AdminUserManagementError("Target user not found"));
    }

    // Update user status
    const updateResult = await context.userRepository.updateStatus(input.userId, input.status);
    if (updateResult.isErr()) {
      return err(new AdminUserManagementError("Failed to update user status", updateResult.error));
    }

    return updateResult;
  } catch (error) {
    return err(new AdminUserManagementError("Unexpected error during status update", error));
  }
}

/**
 * Delete a user account (admin only)
 */
export async function deleteUser(
  context: Context,
  adminUserId: string,
  targetUserId: string,
  reason?: string
): Promise<Result<void, AdminUserManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Prevent admin from deleting their own account
    if (adminUserId === targetUserId) {
      return err(new AdminUserManagementError("Cannot delete your own account"));
    }

    // Verify target user exists
    const userResult = await context.userRepository.findById(targetUserId);
    if (userResult.isErr()) {
      return err(new AdminUserManagementError("Failed to find target user", userResult.error));
    }

    const user = userResult.value;
    if (!user) {
      return err(new AdminUserManagementError("Target user not found"));
    }

    // Delete user
    const deleteResult = await context.userRepository.delete(targetUserId);
    if (deleteResult.isErr()) {
      return err(new AdminUserManagementError("Failed to delete user", deleteResult.error));
    }

    return deleteResult;
  } catch (error) {
    return err(new AdminUserManagementError("Unexpected error during user deletion", error));
  }
}