import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { User } from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { USER_ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class RegisterUserError extends AnyError {
  override readonly name: string = "RegisterUserError";

  constructor(message: string, cause?: unknown) {
    super(message, USER_ERROR_CODES.USER_ALREADY_EXISTS, cause);
  }
}

export const registerUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});
export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

export async function registerUser(
  context: Context,
  input: RegisterUserInput,
): Promise<Result<User, RegisterUserError>> {
  try {
    // Check if email is available
    const emailCheck = await context.userRepository.checkEmailAvailability(
      input.email,
    );
    if (emailCheck.isErr()) {
      return err(
        new RegisterUserError(
          "Failed to check email availability",
          emailCheck.error,
        ),
      );
    }

    if (!emailCheck.value) {
      return err(new RegisterUserError("Email is already in use"));
    }

    // Hash password
    const hashedPasswordResult = await context.passwordHasher.hash(
      input.password,
    );
    if (hashedPasswordResult.isErr()) {
      return err(
        new RegisterUserError(
          "Failed to hash password",
          hashedPasswordResult.error,
        ),
      );
    }

    // Execute user creation and related data in a transaction
    const transactionResult = await context.withTransaction(
      async (txContext) => {
        // Create user
        const createResult = await txContext.userRepository.create({
          email: input.email,
          password: hashedPasswordResult.value,
          name: input.name,
          bio: input.bio,
          avatar: input.avatar,
        });

        if (createResult.isErr()) {
          // Check if it's an email already exists error and preserve the original message
          if (createResult.error.message === "Email already exists") {
            return err(new RegisterUserError("Email is already in use"));
          }
          return err(
            new RegisterUserError("Failed to create user", createResult.error),
          );
        }

        const user = createResult.value;

        // Create default notification settings
        const notificationResult =
          await txContext.notificationSettingsRepository.create({
            userId: user.id,
            emailNotifications: true,
            checkinNotifications: true,
            editorInviteNotifications: true,
            systemNotifications: true,
          });

        if (notificationResult.isErr()) {
          return err(
            new RegisterUserError(
              "Failed to create notification settings",
              notificationResult.error,
            ),
          );
        }

        // Generate email verification token
        const tokenResult =
          await context.tokenGenerator.generateEmailVerificationToken();
        if (tokenResult.isOk()) {
          const verificationTokenResult =
            await txContext.emailVerificationTokenRepository.create({
              userId: user.id,
              token: tokenResult.value,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            });

          if (verificationTokenResult.isErr()) {
            return err(
              new RegisterUserError(
                "Failed to create email verification token",
                verificationTokenResult.error,
              ),
            );
          }
        }

        return ok(user);
      },
    );

    if (transactionResult.isErr()) {
      // If the error is already a RegisterUserError with a specific message, preserve it
      if (transactionResult.error instanceof RegisterUserError) {
        return err(transactionResult.error);
      }
      return err(
        new RegisterUserError(
          "Transaction failed during user registration",
          transactionResult.error,
        ),
      );
    }

    const user = transactionResult.value;

    // Send verification email (outside transaction since it's external service)
    const tokenResult =
      await context.tokenGenerator.generateEmailVerificationToken();
    if (tokenResult.isOk()) {
      const emailResult = await context.emailService.sendVerificationEmail(
        user.email,
        user.name,
        tokenResult.value,
      );

      if (emailResult.isErr()) {
        // Log error but don't fail registration
        console.error("Failed to send verification email:", emailResult.error);
      }
    }

    // Send welcome email
    const welcomeEmailResult = await context.emailService.sendWelcomeEmail(
      user.email,
      user.name,
    );

    if (welcomeEmailResult.isErr()) {
      // Log error but don't fail registration
      console.error("Failed to send welcome email:", welcomeEmailResult.error);
    }

    return ok(user);
  } catch (error) {
    return err(
      new RegisterUserError("Unexpected error during registration", error),
    );
  }
}
