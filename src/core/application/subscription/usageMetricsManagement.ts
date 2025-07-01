import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type {
  SubscriptionPlan,
  UsageMetrics,
  UsageMetricsSummary,
} from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class UsageMetricsManagementError extends AnyError {
  override readonly name = "UsageMetricsManagementError";
}

export const recordUsageInputSchema = z.object({
  regionsCreated: z.number().int().min(0).optional(),
  placesCreated: z.number().int().min(0).optional(),
  checkinsCount: z.number().int().min(0).optional(),
  imagesUploaded: z.number().int().min(0).optional(),
  storageUsedMB: z.number().min(0).optional(),
  apiCallsCount: z.number().int().min(0).optional(),
});
export type RecordUsageInput = z.infer<typeof recordUsageInputSchema>;

export const getUsageInputSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2024).optional(),
  limit: z.number().int().min(1).max(100).default(12),
});
export type GetUsageInput = z.infer<typeof getUsageInputSchema>;

/**
 * Record usage for the current month
 */
export async function recordUsage(
  context: Context,
  userId: string,
  input: RecordUsageInput,
): Promise<Result<UsageMetrics, UsageMetricsManagementError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new UsageMetricsManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = now.getFullYear();

    // Record the usage increment
    const incrementResult = await context.usageMetricsRepository.incrementUsage(
      userId,
      currentMonth,
      currentYear,
      input,
    );
    if (incrementResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to record usage",
          ERROR_CODES.INTERNAL_ERROR,
          incrementResult.error,
        ),
      );
    }

    return ok(incrementResult.value);
  } catch (error) {
    return err(
      new UsageMetricsManagementError(
        "Unexpected error recording usage",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get current month usage for a user
 */
export async function getCurrentMonthUsage(
  context: Context,
  userId: string,
): Promise<Result<UsageMetricsSummary, UsageMetricsManagementError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new UsageMetricsManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Get current month usage
    const usageResult =
      await context.usageMetricsRepository.getCurrentMonthUsage(userId);
    if (usageResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to get current month usage",
          ERROR_CODES.INTERNAL_ERROR,
          usageResult.error,
        ),
      );
    }

    return ok(usageResult.value);
  } catch (error) {
    return err(
      new UsageMetricsManagementError(
        "Unexpected error getting current month usage",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get usage for a specific month
 */
export async function getMonthlyUsage(
  context: Context,
  userId: string,
  month: number,
  year: number,
): Promise<Result<UsageMetricsSummary, UsageMetricsManagementError>> {
  try {
    // Validate month and year
    if (month < 1 || month > 12) {
      return err(
        new UsageMetricsManagementError(
          "Invalid month value",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    if (year < 2024) {
      return err(
        new UsageMetricsManagementError(
          "Invalid year value",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new UsageMetricsManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Get monthly usage
    const usageResult = await context.usageMetricsRepository.getMonthlyUsage(
      userId,
      month,
      year,
    );
    if (usageResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to get monthly usage",
          ERROR_CODES.INTERNAL_ERROR,
          usageResult.error,
        ),
      );
    }

    return ok(usageResult.value);
  } catch (error) {
    return err(
      new UsageMetricsManagementError(
        "Unexpected error getting monthly usage",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get yearly usage history for a user
 */
export async function getYearlyUsage(
  context: Context,
  userId: string,
  year: number,
): Promise<Result<UsageMetricsSummary[], UsageMetricsManagementError>> {
  try {
    // Validate year
    if (year < 2024) {
      return err(
        new UsageMetricsManagementError(
          "Invalid year value",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new UsageMetricsManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Get yearly usage
    const usageResult = await context.usageMetricsRepository.getYearlyUsage(
      userId,
      year,
    );
    if (usageResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to get yearly usage",
          ERROR_CODES.INTERNAL_ERROR,
          usageResult.error,
        ),
      );
    }

    return ok(usageResult.value);
  } catch (error) {
    return err(
      new UsageMetricsManagementError(
        "Unexpected error getting yearly usage",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get usage history for a user (recent months)
 */
export async function getUsageHistory(
  context: Context,
  userId: string,
  input: GetUsageInput = { limit: 12 },
): Promise<Result<UsageMetrics[], UsageMetricsManagementError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new UsageMetricsManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Get usage history
    const usageResult = await context.usageMetricsRepository.findByUserId(
      userId,
      input.limit,
    );
    if (usageResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to get usage history",
          ERROR_CODES.INTERNAL_ERROR,
          usageResult.error,
        ),
      );
    }

    return ok(usageResult.value);
  } catch (error) {
    return err(
      new UsageMetricsManagementError(
        "Unexpected error getting usage history",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Check if user has exceeded plan limits
 */
export async function checkPlanLimits(
  context: Context,
  userId: string,
): Promise<
  Result<
    {
      withinLimits: boolean;
      currentUsage: UsageMetricsSummary;
      limits: {
        regionsCreated: number;
        placesCreated: number;
        storageUsedMB: number;
        apiCallsCount: number;
      };
      overages: {
        regionsCreated: number;
        placesCreated: number;
        storageUsedMB: number;
        apiCallsCount: number;
      };
    },
    UsageMetricsManagementError
  >
> {
  try {
    // Get user's subscription to determine plan
    const subscriptionResult =
      await context.userSubscriptionRepository.findByUserId(userId);
    if (subscriptionResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to find subscription",
          ERROR_CODES.INTERNAL_ERROR,
          subscriptionResult.error,
        ),
      );
    }

    const subscription = subscriptionResult.value;
    const plan = subscription?.plan || "free";

    // Define plan limits
    const planLimits = {
      free: {
        regionsCreated: 3,
        placesCreated: 10,
        storageUsedMB: 100,
        apiCallsCount: 1000,
      },
      standard: {
        regionsCreated: 20,
        placesCreated: 100,
        storageUsedMB: 1000,
        apiCallsCount: 10000,
      },
      premium: {
        regionsCreated: -1, // unlimited
        placesCreated: -1, // unlimited
        storageUsedMB: 10000,
        apiCallsCount: 100000,
      },
    };

    const limits = planLimits[plan];

    // Get current month usage
    const currentUsageResult = await getCurrentMonthUsage(context, userId);
    if (currentUsageResult.isErr()) {
      return err(currentUsageResult.error);
    }

    const currentUsage = currentUsageResult.value;

    // Calculate overages
    const overages = {
      regionsCreated:
        limits.regionsCreated === -1
          ? 0
          : Math.max(0, currentUsage.regionsCreated - limits.regionsCreated),
      placesCreated:
        limits.placesCreated === -1
          ? 0
          : Math.max(0, currentUsage.placesCreated - limits.placesCreated),
      storageUsedMB: Math.max(
        0,
        currentUsage.storageUsedMB - limits.storageUsedMB,
      ),
      apiCallsCount: Math.max(
        0,
        currentUsage.apiCallsCount - limits.apiCallsCount,
      ),
    };

    const withinLimits = Object.values(overages).every(
      (overage) => overage === 0,
    );

    return ok({
      withinLimits,
      currentUsage,
      limits,
      overages,
    });
  } catch (error) {
    return err(
      new UsageMetricsManagementError(
        "Unexpected error checking plan limits",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get aggregated usage statistics by plan (admin function)
 */
export async function getAggregatedUsageByPlan(
  context: Context,
  adminUserId: string,
  plan: SubscriptionPlan,
  startDate: Date,
  endDate: Date,
): Promise<Result<UsageMetricsSummary, UsageMetricsManagementError>> {
  try {
    // Verify admin permissions
    const adminResult = await context.userRepository.findById(adminUserId);
    if (adminResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to find admin user",
          ERROR_CODES.USER_NOT_FOUND,
          adminResult.error,
        ),
      );
    }

    const admin = adminResult.value;
    if (!admin || admin.role !== "admin") {
      return err(
        new UsageMetricsManagementError(
          "Admin permissions required",
          ERROR_CODES.ADMIN_PERMISSION_REQUIRED,
        ),
      );
    }

    // Get aggregated usage
    const usageResult =
      await context.usageMetricsRepository.getAggregatedUsageByPlan(
        plan,
        startDate,
        endDate,
      );
    if (usageResult.isErr()) {
      return err(
        new UsageMetricsManagementError(
          "Failed to get aggregated usage",
          ERROR_CODES.INTERNAL_ERROR,
          usageResult.error,
        ),
      );
    }

    return ok(usageResult.value);
  } catch (error) {
    return err(
      new UsageMetricsManagementError(
        "Unexpected error getting aggregated usage",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Automatically record usage when actions are performed
 */
export async function autoRecordUsage(
  context: Context,
  userId: string,
  action:
    | { type: "region_created" }
    | { type: "place_created" }
    | { type: "checkin_created" }
    | { type: "image_uploaded"; sizeKB: number }
    | { type: "api_call" },
): Promise<Result<void, UsageMetricsManagementError>> {
  try {
    const usageInput: RecordUsageInput = {};

    switch (action.type) {
      case "region_created":
        usageInput.regionsCreated = 1;
        break;
      case "place_created":
        usageInput.placesCreated = 1;
        break;
      case "checkin_created":
        usageInput.checkinsCount = 1;
        break;
      case "image_uploaded":
        usageInput.imagesUploaded = 1;
        usageInput.storageUsedMB = action.sizeKB / 1024; // Convert KB to MB
        break;
      case "api_call":
        usageInput.apiCallsCount = 1;
        break;
    }

    const recordResult = await recordUsage(context, userId, usageInput);
    if (recordResult.isErr()) {
      // Log error but don't fail the main operation
      console.error("Failed to record usage:", recordResult.error);
    }

    return ok(undefined);
  } catch (error) {
    // Log error but don't fail the main operation
    console.error("Unexpected error auto-recording usage:", error);
    return ok(undefined);
  }
}
