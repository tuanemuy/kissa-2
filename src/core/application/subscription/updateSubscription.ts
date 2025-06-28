import { z } from "zod/v4";
import { err, ok, type Result } from "neverthrow";
import type { UserSubscription, SubscriptionPlan, SubscriptionStatus } from "@/core/domain/user/types";
import type { Context } from "../context";
import { AnyError } from "@/lib/error";

export class UpdateSubscriptionError extends AnyError {
  override readonly name = "UpdateSubscriptionError";
  
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export const updateSubscriptionInputSchema = z.object({
  plan: z.enum(["free", "standard", "premium"]).optional(),
  status: z.enum(["none", "trial", "active", "expired", "cancelled"]).optional(),
  extendDays: z.number().int().min(1).max(365).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionInputSchema>;

export async function updateSubscription(
  context: Context,
  userId: string,
  input: UpdateSubscriptionInput
): Promise<Result<UserSubscription, UpdateSubscriptionError>> {
  try {
    // Find existing subscription
    const subscriptionResult = await context.userSubscriptionRepository.findByUserId(userId);
    if (subscriptionResult.isErr()) {
      return err(new UpdateSubscriptionError("Failed to find subscription", subscriptionResult.error));
    }

    const subscription = subscriptionResult.value;
    if (!subscription) {
      return err(new UpdateSubscriptionError("User subscription not found"));
    }

    // Prepare update parameters
    const updateParams: any = {};
    
    if (input.plan !== undefined) {
      updateParams.plan = input.plan;
    }
    
    if (input.status !== undefined) {
      updateParams.status = input.status;
    }
    
    if (input.cancelAtPeriodEnd !== undefined) {
      updateParams.cancelAtPeriodEnd = input.cancelAtPeriodEnd;
    }

    // Handle period extension
    if (input.extendDays !== undefined) {
      const newPeriodEnd = new Date(subscription.currentPeriodEnd);
      newPeriodEnd.setDate(newPeriodEnd.getDate() + input.extendDays);
      updateParams.currentPeriodEnd = newPeriodEnd;
    }

    // Update subscription
    const updateResult = await context.userSubscriptionRepository.update(subscription.id, updateParams);
    if (updateResult.isErr()) {
      return err(new UpdateSubscriptionError("Failed to update subscription", updateResult.error));
    }

    return updateResult;
  } catch (error) {
    return err(new UpdateSubscriptionError("Unexpected error during subscription update", error));
  }
}

export async function cancelSubscription(
  context: Context,
  userId: string,
  cancelImmediately: boolean = false
): Promise<Result<UserSubscription, UpdateSubscriptionError>> {
  try {
    // Find existing subscription
    const subscriptionResult = await context.userSubscriptionRepository.findByUserId(userId);
    if (subscriptionResult.isErr()) {
      return err(new UpdateSubscriptionError("Failed to find subscription", subscriptionResult.error));
    }

    const subscription = subscriptionResult.value;
    if (!subscription) {
      return err(new UpdateSubscriptionError("User subscription not found"));
    }

    let updateParams: any;
    
    if (cancelImmediately) {
      // Cancel immediately
      updateParams = {
        status: "cancelled" as SubscriptionStatus,
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
      };
    } else {
      // Cancel at period end
      updateParams = {
        cancelAtPeriodEnd: true,
      };
    }

    // Update subscription
    const updateResult = await context.userSubscriptionRepository.update(subscription.id, updateParams);
    if (updateResult.isErr()) {
      return err(new UpdateSubscriptionError("Failed to cancel subscription", updateResult.error));
    }

    return updateResult;
  } catch (error) {
    return err(new UpdateSubscriptionError("Unexpected error during subscription cancellation", error));
  }
}

export async function renewSubscription(
  context: Context,
  userId: string,
  periodLengthDays: number = 30
): Promise<Result<UserSubscription, UpdateSubscriptionError>> {
  try {
    // Find existing subscription
    const subscriptionResult = await context.userSubscriptionRepository.findByUserId(userId);
    if (subscriptionResult.isErr()) {
      return err(new UpdateSubscriptionError("Failed to find subscription", subscriptionResult.error));
    }

    const subscription = subscriptionResult.value;
    if (!subscription) {
      return err(new UpdateSubscriptionError("User subscription not found"));
    }

    // Calculate new period
    const now = new Date();
    const currentEnd = subscription.currentPeriodEnd;
    const newPeriodStart = currentEnd > now ? currentEnd : now;
    const newPeriodEnd = new Date(newPeriodStart);
    newPeriodEnd.setDate(newPeriodEnd.getDate() + periodLengthDays);

    const updateParams = {
      status: "active" as SubscriptionStatus,
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      cancelAtPeriodEnd: false,
    };

    // Update subscription
    const updateResult = await context.userSubscriptionRepository.update(subscription.id, updateParams);
    if (updateResult.isErr()) {
      return err(new UpdateSubscriptionError("Failed to renew subscription", updateResult.error));
    }

    return updateResult;
  } catch (error) {
    return err(new UpdateSubscriptionError("Unexpected error during subscription renewal", error));
  }
}