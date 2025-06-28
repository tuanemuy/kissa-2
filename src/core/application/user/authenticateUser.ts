import { z } from "zod/v4";
import { err, ok, type Result } from "neverthrow";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import { AnyError } from "@/lib/error";

export class AuthenticateUserError extends AnyError {
  override readonly name = "AuthenticateUserError";
  
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
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
  input: AuthenticateUserInput
): Promise<Result<AuthenticateUserResult, AuthenticateUserError>> {
  try {
    // Find user by email
    const userResult = await context.userRepository.findByEmail(input.email);
    if (userResult.isErr()) {
      return err(new AuthenticateUserError("Failed to find user", userResult.error));
    }

    const user = userResult.value;
    if (!user) {
      return err(new AuthenticateUserError("Invalid credentials"));
    }

    // Check if user is active
    if (user.status !== "active") {
      return err(new AuthenticateUserError("Account is not active"));
    }

    // Verify password
    const passwordResult = await context.passwordHasher.verify(input.password, user.hashedPassword);
    if (passwordResult.isErr()) {
      return err(new AuthenticateUserError("Failed to verify password", passwordResult.error));
    }

    if (!passwordResult.value) {
      return err(new AuthenticateUserError("Invalid credentials"));
    }

    // Generate session token
    const tokenResult = await context.tokenGenerator.generateSessionToken();
    if (tokenResult.isErr()) {
      return err(new AuthenticateUserError("Failed to generate session token", tokenResult.error));
    }

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const sessionResult = await context.userSessionRepository.create({
      userId: user.id,
      token: tokenResult.value,
      expiresAt,
    });

    if (sessionResult.isErr()) {
      return err(new AuthenticateUserError("Failed to create session", sessionResult.error));
    }

    // Update last login
    const lastLoginResult = await context.userRepository.updateLastLogin(user.id);
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
    return err(new AuthenticateUserError("Unexpected error during authentication", error));
  }
}