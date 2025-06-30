import { err, ok, type Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import { USER_ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class PasswordResetApplicationError extends AnyError {
  override readonly name: string = "PasswordResetApplicationError";

  constructor(message: string, cause?: unknown) {
    super(message, USER_ERROR_CODES.USER_NOT_FOUND, cause);
  }
}

export interface RequestPasswordResetParams {
  email: string;
}

export interface ResetPasswordParams {
  token: string;
  newPassword: string;
}

/**
 * Request a password reset by sending a reset token to the user's email
 */
export async function requestPasswordReset(
  context: Context,
  params: RequestPasswordResetParams,
): Promise<Result<void, PasswordResetApplicationError>> {
  // Find user by email
  const userResult = await context.userRepository.findByEmail(params.email);
  if (userResult.isErr()) {
    return err(
      new PasswordResetApplicationError(
        "Failed to find user",
        userResult.error,
      ),
    );
  }

  if (!userResult.value) {
    // For security, we don't reveal whether the email exists or not
    // Return success even if user doesn't exist
    return ok(undefined);
  }

  const user = userResult.value;

  // Generate reset token
  const tokenResult = await context.tokenGenerator.generatePasswordResetToken();
  if (tokenResult.isErr()) {
    return err(
      new PasswordResetApplicationError(
        "Failed to generate reset token",
        tokenResult.error,
      ),
    );
  }

  const token = tokenResult.value;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  // Store the reset token
  const storeTokenResult = await context.passwordResetTokenRepository.create({
    userId: user.id,
    token,
    expiresAt,
  });
  if (storeTokenResult.isErr()) {
    return err(
      new PasswordResetApplicationError(
        "Failed to store reset token",
        storeTokenResult.error,
      ),
    );
  }

  // Send password reset email
  const emailResult = await context.emailService.sendPasswordResetEmail(
    user.email,
    user.name,
    token,
  );
  if (emailResult.isErr()) {
    return err(
      new PasswordResetApplicationError(
        "Failed to send password reset email",
        emailResult.error,
      ),
    );
  }

  return ok(undefined);
}

/**
 * Reset password using a valid reset token
 */
export async function resetPassword(
  context: Context,
  params: ResetPasswordParams,
): Promise<Result<void, PasswordResetApplicationError>> {
  // Find and validate the reset token
  const tokenResult = await context.passwordResetTokenRepository.findByToken(
    params.token,
  );
  if (tokenResult.isErr()) {
    return err(
      new PasswordResetApplicationError(
        "Failed to find reset token",
        tokenResult.error,
      ),
    );
  }

  if (!tokenResult.value) {
    return err(
      new PasswordResetApplicationError("Invalid or expired reset token"),
    );
  }

  const resetToken = tokenResult.value;

  // Check if token is expired
  if (resetToken.expiresAt < new Date()) {
    return err(new PasswordResetApplicationError("Reset token has expired"));
  }

  // Check if token has already been used
  if (resetToken.usedAt) {
    return err(
      new PasswordResetApplicationError("Reset token has already been used"),
    );
  }

  // Hash the new password
  const hashResult = await context.passwordHasher.hash(params.newPassword);
  if (hashResult.isErr()) {
    return err(
      new PasswordResetApplicationError(
        "Failed to hash new password",
        hashResult.error,
      ),
    );
  }

  const hashedPassword = hashResult.value;

  // Update user's password
  const updateUserResult = await context.userRepository.updatePassword(
    resetToken.userId,
    hashedPassword,
  );
  if (updateUserResult.isErr()) {
    return err(
      new PasswordResetApplicationError(
        "Failed to update user password",
        updateUserResult.error,
      ),
    );
  }

  // Mark token as used
  const markUsedResult = await context.passwordResetTokenRepository.markAsUsed(
    resetToken.id,
  );
  if (markUsedResult.isErr()) {
    return err(
      new PasswordResetApplicationError(
        "Failed to mark token as used",
        markUsedResult.error,
      ),
    );
  }

  // Invalidate all existing sessions for security
  const invalidateSessionsResult =
    await context.userSessionRepository.deleteByUserId(resetToken.userId);
  if (invalidateSessionsResult.isErr()) {
    return err(
      new PasswordResetApplicationError(
        "Failed to invalidate existing sessions",
        invalidateSessionsResult.error,
      ),
    );
  }

  return ok(undefined);
}

/**
 * Clean up expired password reset tokens
 */
export async function cleanupExpiredTokens(
  context: Context,
): Promise<Result<number, PasswordResetApplicationError>> {
  const result = await context.passwordResetTokenRepository.deleteExpired();
  if (result.isErr()) {
    return err(
      new PasswordResetApplicationError(
        "Failed to cleanup expired tokens",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
