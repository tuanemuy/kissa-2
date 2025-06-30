import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { User } from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class UserProfileManagementError extends AnyError {
  override readonly name = "UserProfileManagementError";
}

export const updateUserProfileInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});
export type UpdateUserProfileInput = z.infer<
  typeof updateUserProfileInputSchema
>;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

/**
 * Get user profile by ID
 */
export async function getUserProfile(
  context: Context,
  userId: string,
): Promise<Result<User, UserProfileManagementError>> {
  try {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return err(
        new UserProfileManagementError(
          "Invalid UUID format",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UserProfileManagementError(
          "Failed to get user profile",
          ERROR_CODES.INTERNAL_ERROR,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new UserProfileManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    return ok(userResult.value);
  } catch (error) {
    return err(
      new UserProfileManagementError(
        "Unexpected error during profile retrieval",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  context: Context,
  userId: string,
  input: UpdateUserProfileInput,
): Promise<Result<User, UserProfileManagementError>> {
  try {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return err(
        new UserProfileManagementError(
          "Invalid UUID format",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UserProfileManagementError(
          "Failed to find user",
          ERROR_CODES.INTERNAL_ERROR,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new UserProfileManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Update profile
    const updateResult = await context.userRepository.updateProfile(
      userId,
      input,
    );
    if (updateResult.isErr()) {
      return err(
        new UserProfileManagementError(
          "Failed to update user profile",
          ERROR_CODES.INTERNAL_ERROR,
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new UserProfileManagementError(
        "Unexpected error during profile update",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Change user password
 */
export async function changeUserPassword(
  context: Context,
  userId: string,
  input: ChangePasswordInput,
): Promise<Result<void, UserProfileManagementError>> {
  try {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return err(
        new UserProfileManagementError(
          "Invalid UUID format",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Verify user exists and current password
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UserProfileManagementError(
          "Failed to find user",
          ERROR_CODES.INTERNAL_ERROR,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new UserProfileManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Verify current password
    const passwordVerifyResult = await context.passwordHasher.verify(
      input.currentPassword,
      userResult.value.hashedPassword,
    );

    if (passwordVerifyResult.isErr()) {
      return err(
        new UserProfileManagementError(
          "Failed to verify current password",
          ERROR_CODES.INTERNAL_ERROR,
          passwordVerifyResult.error,
        ),
      );
    }

    if (!passwordVerifyResult.value) {
      return err(
        new UserProfileManagementError(
          "Current password is incorrect",
          ERROR_CODES.INVALID_CREDENTIALS,
        ),
      );
    }

    // Hash new password
    const hashResult = await context.passwordHasher.hash(input.newPassword);
    if (hashResult.isErr()) {
      return err(
        new UserProfileManagementError(
          "Failed to hash new password",
          ERROR_CODES.INTERNAL_ERROR,
          hashResult.error,
        ),
      );
    }

    // Update password
    const updateResult = await context.userRepository.updatePassword(
      userId,
      hashResult.value,
    );

    if (updateResult.isErr()) {
      return err(
        new UserProfileManagementError(
          "Failed to update password",
          ERROR_CODES.INTERNAL_ERROR,
          updateResult.error,
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      new UserProfileManagementError(
        "Unexpected error during password change",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
