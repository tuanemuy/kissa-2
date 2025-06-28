import { z } from "zod/v4";
import { err, ok, type Result } from "neverthrow";
import type { UserSubscription, SubscriptionPlan, SubscriptionStatus } from "@/core/domain/user/types";
import type { Context } from "../context";
import { AnyError } from "@/lib/error";

export class CreateSubscriptionError extends AnyError {
  override readonly name = "CreateSubscriptionError";
  
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export const createSubscriptionInputSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(["free", "standard", "premium"]),
  status: z.enum(["none", "trial", "active", "expired", "cancelled"]).default("trial"),
  periodLengthDays: z.number().int().min(1).max(365).default(30),
});
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionInputSchema>;

export async function createSubscription(
  context: Context,
  input: CreateSubscriptionInput
): Promise<Result<UserSubscription, CreateSubscriptionError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(new CreateSubscriptionError("Failed to find user", userResult.error));
    }

    const user = userResult.value;
    if (!user) {
      return err(new CreateSubscriptionError("User not found"));
    }

    if (user.status !== "active") {
      return err(new CreateSubscriptionError("User account is not active"));
    }

    // Check if user already has a subscription
    const existingSubscriptionResult = await context.userSubscriptionRepository.findByUserId(input.userId);
    if (existingSubscriptionResult.isErr()) {
      return err(new CreateSubscriptionError("Failed to check existing subscription", existingSubscriptionResult.error));
    }

    if (existingSubscriptionResult.value) {
      return err(new CreateSubscriptionError("User already has a subscription"));
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
      return err(new CreateSubscriptionError("Failed to create subscription", subscriptionResult.error));
    }

    return subscriptionResult;
  } catch (error) {
    return err(new CreateSubscriptionError("Unexpected error during subscription creation", error));
  }
}