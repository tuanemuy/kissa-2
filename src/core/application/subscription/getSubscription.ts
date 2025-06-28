import { err, ok, type Result } from "neverthrow";
import type { UserSubscription } from "@/core/domain/user/types";
import type { Context } from "../context";
import { AnyError } from "@/lib/error";

export class GetSubscriptionError extends AnyError {
  override readonly name = "GetSubscriptionError";
  
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export interface SubscriptionStatus {
  subscription: UserSubscription | null;
  isActive: boolean;
  isExpired: boolean;
  isCancelled: boolean;
  daysUntilExpiry: number | null;
  hasActiveSubscription: boolean;
}

export async function getSubscription(
  context: Context,
  userId: string
): Promise<Result<UserSubscription | null, GetSubscriptionError>> {
  try {
    const subscriptionResult = await context.userSubscriptionRepository.findByUserId(userId);
    if (subscriptionResult.isErr()) {
      return err(new GetSubscriptionError("Failed to find subscription", subscriptionResult.error));
    }

    return subscriptionResult;
  } catch (error) {
    return err(new GetSubscriptionError("Unexpected error getting subscription", error));
  }
}

export async function getSubscriptionStatus(
  context: Context,
  userId: string
): Promise<Result<SubscriptionStatus, GetSubscriptionError>> {
  try {
    const subscriptionResult = await context.userSubscriptionRepository.findByUserId(userId);
    if (subscriptionResult.isErr()) {
      return err(new GetSubscriptionError("Failed to find subscription", subscriptionResult.error));
    }

    const subscription = subscriptionResult.value;
    
    if (!subscription) {
      return ok({
        subscription: null,
        isActive: false,
        isExpired: false,
        isCancelled: false,
        daysUntilExpiry: null,
        hasActiveSubscription: false,
      });
    }

    const now = new Date();
    const isExpired = subscription.currentPeriodEnd < now;
    const isActive = subscription.status === "active" && !isExpired;
    const isCancelled = subscription.status === "cancelled" || subscription.cancelAtPeriodEnd;
    
    let daysUntilExpiry: number | null = null;
    if (subscription.currentPeriodEnd) {
      const timeDiff = subscription.currentPeriodEnd.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    const hasActiveSubscription = (subscription.status === "active" || subscription.status === "trial") && !isExpired;

    return ok({
      subscription,
      isActive,
      isExpired,
      isCancelled,
      daysUntilExpiry,
      hasActiveSubscription,
    });
  } catch (error) {
    return err(new GetSubscriptionError("Unexpected error checking subscription status", error));
  }
}

export async function checkSubscriptionPermissions(
  context: Context,
  userId: string,
  requiredPlan: "free" | "standard" | "premium" = "free"
): Promise<Result<boolean, GetSubscriptionError>> {
  try {
    const statusResult = await getSubscriptionStatus(context, userId);
    if (statusResult.isErr()) {
      return statusResult;
    }

    const status = statusResult.value;
    
    // If no subscription required (free), return true
    if (requiredPlan === "free") {
      return ok(true);
    }

    // If no active subscription and plan required, return false
    if (!status.hasActiveSubscription) {
      return ok(false);
    }

    const subscription = status.subscription!;
    
    // Check plan hierarchy: premium > standard > free
    const planHierarchy = { free: 0, standard: 1, premium: 2 };
    const userPlanLevel = planHierarchy[subscription.plan];
    const requiredPlanLevel = planHierarchy[requiredPlan];
    
    return ok(userPlanLevel >= requiredPlanLevel);
  } catch (error) {
    return err(new GetSubscriptionError("Unexpected error checking subscription permissions", error));
  }
}