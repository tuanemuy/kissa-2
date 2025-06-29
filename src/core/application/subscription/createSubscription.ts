import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { UserSubscription } from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class CreateSubscriptionError extends AnyError {
  override readonly name = "CreateSubscriptionError";
}

export const createSubscriptionInputSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(["free", "standard", "premium"]),
  status: z
    .enum(["none", "trial", "active", "expired", "cancelled"])
    .default("trial"),
  periodLengthDays: z.number().int().min(1).max(365).default(30),
});
export type CreateSubscriptionInput = z.infer<
  typeof createSubscriptionInputSchema
>;

export async function createSubscription(
  context: Context,
  input: CreateSubscriptionInput,
): Promise<Result<UserSubscription, CreateSubscriptionError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(
        new CreateSubscriptionError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new CreateSubscriptionError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new CreateSubscriptionError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Check if user already has a subscription
    const existingSubscriptionResult =
      await context.userSubscriptionRepository.findByUserId(input.userId);
    if (existingSubscriptionResult.isErr()) {
      return err(
        new CreateSubscriptionError(
          "Failed to check existing subscription",
          ERROR_CODES.INTERNAL_ERROR,
          existingSubscriptionResult.error,
        ),
      );
    }

    if (existingSubscriptionResult.value) {
      return err(
        new CreateSubscriptionError(
          "User already has a subscription",
          ERROR_CODES.SUBSCRIPTION_ALREADY_EXISTS,
        ),
      );
    }

    // Calculate subscription period
    const now = new Date();
    const periodEndDate = new Date(now);
    periodEndDate.setDate(periodEndDate.getDate() + input.periodLengthDays);

    // Create subscription
    const subscriptionResult = await context.userSubscriptionRepository.create({
      userId: input.userId,
      plan: input.plan,
      status: input.status,
      currentPeriodStart: now,
      currentPeriodEnd: periodEndDate,
      cancelAtPeriodEnd: false,
    });

    if (subscriptionResult.isErr()) {
      // Check if this is a duplicate subscription error
      if (
        subscriptionResult.error.message === "User already has a subscription"
      ) {
        return err(
          new CreateSubscriptionError(
            "User already has a subscription",
            ERROR_CODES.SUBSCRIPTION_ALREADY_EXISTS,
          ),
        );
      }

      return err(
        new CreateSubscriptionError(
          "Failed to create subscription",
          ERROR_CODES.INTERNAL_ERROR,
          subscriptionResult.error,
        ),
      );
    }

    return ok(subscriptionResult.value);
  } catch (error) {
    return err(
      new CreateSubscriptionError(
        "Unexpected error during subscription creation",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
