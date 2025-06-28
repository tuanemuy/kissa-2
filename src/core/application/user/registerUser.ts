import { z } from "zod/v4";
import { err, ok, type Result } from "neverthrow";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import { AnyError } from "@/lib/error";

export class RegisterUserError extends AnyError {
  override readonly name = "RegisterUserError";
  
  constructor(message: string, cause?: unknown) {
    super(message, cause);
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
  input: RegisterUserInput
): Promise<Result<User, RegisterUserError>> {
  try {
    // Check if email is available
    const emailCheck = await context.userRepository.checkEmailAvailability(input.email);
    if (emailCheck.isErr()) {
      return err(new RegisterUserError("Failed to check email availability", emailCheck.error));
    }
    
    if (!emailCheck.value) {
      return err(new RegisterUserError("Email is already in use"));
    }

    // Hash password
    const hashedPasswordResult = await context.passwordHasher.hash(input.password);
    if (hashedPasswordResult.isErr()) {
      return err(new RegisterUserError("Failed to hash password", hashedPasswordResult.error));
    }

    // Create user
    const createResult = await context.userRepository.create({
      email: input.email,
      password: hashedPasswordResult.value,
      name: input.name,
      bio: input.bio,
      avatar: input.avatar,
    });

    if (createResult.isErr()) {
      return err(new RegisterUserError("Failed to create user", createResult.error));
    }

    const user = createResult.value;

    // Create default notification settings
    const notificationResult = await context.notificationSettingsRepository.create({
      userId: user.id,
      emailNotifications: true,
      checkinNotifications: true,
      editorInviteNotifications: true,
      systemNotifications: true,
    });

    if (notificationResult.isErr()) {
      // Log error but don't fail registration
      console.error("Failed to create notification settings:", notificationResult.error);
    }

    // Generate email verification token
    const tokenResult = await context.tokenGenerator.generateEmailVerificationToken();
    if (tokenResult.isOk()) {
      const verificationTokenResult = await context.emailVerificationTokenRepository.create({
        userId: user.id,
        token: tokenResult.value,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      if (verificationTokenResult.isOk()) {
        // Send verification email
        const emailResult = await context.emailService.sendVerificationEmail(
          user.email,
          user.name,
          tokenResult.value
        );

        if (emailResult.isErr()) {
          // Log error but don't fail registration
          console.error("Failed to send verification email:", emailResult.error);
        }
      }
    }

    // Send welcome email
    const welcomeEmailResult = await context.emailService.sendWelcomeEmail(
      user.email,
      user.name
    );

    if (welcomeEmailResult.isErr()) {
      // Log error but don't fail registration
      console.error("Failed to send welcome email:", welcomeEmailResult.error);
    }

    return ok(user);
  } catch (error) {
    return err(new RegisterUserError("Unexpected error during registration", error));
  }
}