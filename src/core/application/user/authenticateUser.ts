import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { User } from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class AuthenticateUserError extends AnyError {
  override readonly name = "AuthenticateUserError";
}

export const authenticateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type AuthenticateUserInput = z.infer<typeof authenticateUserInputSchema>;

export interface AuthenticateUserResult {
  user: User;
  token: string;
  expiresAt: Date;
}

export async function authenticateUser(
  context: Context,
  input: AuthenticateUserInput,
): Promise<Result<AuthenticateUserResult, AuthenticateUserError>> {
  try {
    // Find user by email
    const userResult = await context.userRepository.findByEmail(input.email);
    if (userResult.isErr()) {
      return err(
        new AuthenticateUserError(
          "Failed to find user",
          ERROR_CODES.INTERNAL_ERROR,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new AuthenticateUserError(
          "Invalid credentials",
          ERROR_CODES.INVALID_CREDENTIALS,
        ),
      );
    }

    // Check if user is active
    if (user.status !== "active") {
      return err(
        new AuthenticateUserError(
          "Account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Verify password
    const passwordResult = await context.passwordHasher.verify(
      input.password,
      user.hashedPassword,
    );
    if (passwordResult.isErr()) {
      return err(
        new AuthenticateUserError(
          "Failed to verify password",
          ERROR_CODES.INTERNAL_ERROR,
          passwordResult.error,
        ),
      );
    }

    if (!passwordResult.value) {
      return err(
        new AuthenticateUserError(
          "Invalid credentials",
          ERROR_CODES.INVALID_CREDENTIALS,
        ),
      );
    }

    // Generate session token
    const tokenResult = await context.tokenGenerator.generateSessionToken();
    if (tokenResult.isErr()) {
      return err(
        new AuthenticateUserError(
          "Failed to generate session token",
          ERROR_CODES.INTERNAL_ERROR,
          tokenResult.error,
        ),
      );
    }

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const sessionResult = await context.userSessionRepository.create({
      userId: user.id,
      token: tokenResult.value,
      expiresAt,
    });

    if (sessionResult.isErr()) {
      return err(
        new AuthenticateUserError(
          "Failed to create session",
          ERROR_CODES.INTERNAL_ERROR,
          sessionResult.error,
        ),
      );
    }

    // Update last login
    const lastLoginResult = await context.userRepository.updateLastLogin(
      user.id,
    );
    if (lastLoginResult.isErr()) {
      // Log error but don't fail authentication
      console.error("Failed to update last login:", lastLoginResult.error);
    }

    return ok({
      user: lastLoginResult.isOk() ? lastLoginResult.value : user,
      token: tokenResult.value,
      expiresAt,
    });
  } catch (error) {
    return err(
      new AuthenticateUserError(
        "Unexpected error during authentication",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
