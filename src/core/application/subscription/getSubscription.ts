import { err, ok, type Result } from "neverthrow";
import type { UserSubscription } from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class GetSubscriptionError extends AnyError {
  override readonly name = "GetSubscriptionError";
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
  userId: string,
): Promise<Result<UserSubscription | null, GetSubscriptionError>> {
  try {
    // Verify user ID format and that user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new GetSubscriptionError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    // User can be null (not found) - that's OK for this function
    // We still look for their subscription

    const subscriptionResult =
      await context.userSubscriptionRepository.findByUserId(userId);
    if (subscriptionResult.isErr()) {
      return err(
        new GetSubscriptionError(
          "Failed to find subscription",
          ERROR_CODES.INTERNAL_ERROR,
          subscriptionResult.error,
        ),
      );
    }

    return ok(subscriptionResult.value);
  } catch (error) {
    return err(
      new GetSubscriptionError(
        "Unexpected error getting subscription",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

export async function getSubscriptionStatus(
  context: Context,
  userId: string,
): Promise<Result<SubscriptionStatus, GetSubscriptionError>> {
  try {
    // Verify user ID format and that user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new GetSubscriptionError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    // User can be null (not found) - that's OK for this function
    // We still look for their subscription status

    const subscriptionResult =
      await context.userSubscriptionRepository.findByUserId(userId);
    if (subscriptionResult.isErr()) {
      return err(
        new GetSubscriptionError(
          "Failed to find subscription",
          ERROR_CODES.INTERNAL_ERROR,
          subscriptionResult.error,
        ),
      );
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
    const isCancelled =
      subscription.status === "cancelled" || subscription.cancelAtPeriodEnd;

    let daysUntilExpiry: number | null = null;
    if (subscription.currentPeriodEnd) {
      const timeDiff = subscription.currentPeriodEnd.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    const hasActiveSubscription =
      (subscription.status === "active" || subscription.status === "trial") &&
      !isExpired;

    return ok({
      subscription,
      isActive,
      isExpired,
      isCancelled,
      daysUntilExpiry,
      hasActiveSubscription,
    });
  } catch (error) {
    return err(
      new GetSubscriptionError(
        "Unexpected error checking subscription status",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

export async function checkSubscriptionPermissions(
  context: Context,
  userId: string,
  requiredPlan: "free" | "standard" | "premium" = "free",
): Promise<Result<boolean, GetSubscriptionError>> {
  try {
    const statusResult = await getSubscriptionStatus(context, userId);
    if (statusResult.isErr()) {
      return err(statusResult.error);
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

    const subscription = status.subscription;
    if (!subscription) {
      return err(
        new GetSubscriptionError(
          "Subscription not found",
          ERROR_CODES.SUBSCRIPTION_NOT_FOUND,
        ),
      );
    }

    // Check plan hierarchy: premium > standard > free
    const planHierarchy = { free: 0, standard: 1, premium: 2 };
    const userPlanLevel = planHierarchy[subscription.plan];
    const requiredPlanLevel = planHierarchy[requiredPlan];

    return ok(userPlanLevel >= requiredPlanLevel);
  } catch (error) {
    return err(
      new GetSubscriptionError(
        "Unexpected error checking subscription permissions",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
