import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { User } from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class SystemAnalyticsError extends AnyError {
  override readonly name = "SystemAnalyticsError";
}

export const getAnalyticsInputSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  period: z.enum(["day", "week", "month", "year"]).default("month"),
});
export type GetAnalyticsInput = z.infer<typeof getAnalyticsInputSchema>;

export interface SystemStatistics {
  users: {
    total: number;
    active: number;
    suspended: number;
    deleted: number;
    byRole: {
      visitor: number;
      editor: number;
      admin: number;
    };
    newThisMonth: number;
    newThisWeek: number;
  };
  content: {
    regions: {
      total: number;
      published: number;
      draft: number;
      archived: number;
    };
    places: {
      total: number;
      published: number;
      draft: number;
      archived: number;
    };
    checkins: {
      total: number;
      thisMonth: number;
      thisWeek: number;
    };
  };
  subscriptions: {
    total: number;
    active: number;
    trial: number;
    expired: number;
    cancelled: number;
    byPlan: {
      free: number;
      standard: number;
      premium: number;
    };
    revenue: {
      total: number;
      thisMonth: number;
      thisYear: number;
    };
  };
  usage: {
    totalStorage: number;
    totalApiCalls: number;
    averageUsageByPlan: {
      free: {
        regions: number;
        places: number;
        storage: number;
      };
      standard: {
        regions: number;
        places: number;
        storage: number;
      };
      premium: {
        regions: number;
        places: number;
        storage: number;
      };
    };
  };
}

export interface UserGrowthData {
  period: Date;
  newUsers: number;
  activeUsers: number;
  totalUsers: number;
  churnedUsers: number;
  retentionRate: number;
}

export interface RevenueAnalytics {
  period: Date;
  revenue: number;
  subscriptions: number;
  averageRevenuePerUser: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
}

/**
 * Check if the requesting user has admin privileges
 */
async function checkAdminPermissions(
  context: Context,
  adminUserId: string,
): Promise<Result<User, SystemAnalyticsError>> {
  const adminResult = await context.userRepository.findById(adminUserId);
  if (adminResult.isErr()) {
    return err(
      new SystemAnalyticsError(
        "Admin user not found",
        ERROR_CODES.USER_NOT_FOUND,
        adminResult.error,
      ),
    );
  }

  const admin = adminResult.value;
  if (!admin) {
    return err(
      new SystemAnalyticsError(
        "Admin user not found",
        ERROR_CODES.USER_NOT_FOUND,
      ),
    );
  }

  if (admin.role !== "admin") {
    return err(
      new SystemAnalyticsError(
        "Insufficient permissions: admin role required",
        ERROR_CODES.ADMIN_PERMISSION_REQUIRED,
      ),
    );
  }

  if (admin.status !== "active") {
    return err(
      new SystemAnalyticsError(
        "Admin account is not active",
        ERROR_CODES.USER_INACTIVE,
      ),
    );
  }

  return ok(admin);
}

/**
 * Get comprehensive system statistics
 */
export async function getSystemStatistics(
  context: Context,
  adminUserId: string,
): Promise<Result<SystemStatistics, SystemAnalyticsError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const _startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get user statistics
    const [
      allUsersResult,
      activeUsersResult,
      suspendedUsersResult,
      deletedUsersResult,
      visitorUsersResult,
      editorUsersResult,
      adminUsersResult,
      newUsersThisMonthResult,
      newUsersThisWeekResult,
    ] = await Promise.all([
      context.userRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
      }),
      context.userRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { status: "active" },
      }),
      context.userRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { status: "suspended" },
      }),
      context.userRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { status: "deleted" },
      }),
      context.userRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { role: "visitor" },
      }),
      context.userRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { role: "editor" },
      }),
      context.userRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { role: "admin" },
      }),
      // TODO: Add date filtering for new users this month
      context.userRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
      }),
      // TODO: Add date filtering for new users this week
      context.userRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
      }),
    ]);

    // Get content statistics
    const [
      allRegionsResult,
      publishedRegionsResult,
      draftRegionsResult,
      archivedRegionsResult,
      allPlacesResult,
      publishedPlacesResult,
      draftPlacesResult,
      archivedPlacesResult,
    ] = await Promise.all([
      context.regionRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
      }),
      context.regionRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { status: "published" },
      }),
      context.regionRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { status: "draft" },
      }),
      context.regionRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { status: "archived" },
      }),
      context.placeRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
      }),
      context.placeRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { status: "published" },
      }),
      context.placeRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { status: "draft" },
      }),
      context.placeRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { status: "archived" },
      }),
    ]);

    // Get subscription statistics
    const [
      allSubscriptionsResult,
      activeSubscriptionsResult,
      trialSubscriptionsResult,
      expiredSubscriptionsResult,
      cancelledSubscriptionsResult,
      freeSubscriptionsResult,
      standardSubscriptionsResult,
      premiumSubscriptionsResult,
    ] = await Promise.all([
      context.userSubscriptionRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { dateRange: { from: new Date(0), to: now } },
      }),
      context.userSubscriptionRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { status: "active", dateRange: { from: new Date(0), to: now } },
      }),
      context.userSubscriptionRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { status: "trial", dateRange: { from: new Date(0), to: now } },
      }),
      context.userSubscriptionRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: {
          status: "expired",
          dateRange: { from: new Date(0), to: now },
        },
      }),
      context.userSubscriptionRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: {
          status: "cancelled",
          dateRange: { from: new Date(0), to: now },
        },
      }),
      context.userSubscriptionRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { plan: "free", dateRange: { from: new Date(0), to: now } },
      }),
      context.userSubscriptionRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { plan: "standard", dateRange: { from: new Date(0), to: now } },
      }),
      context.userSubscriptionRepository.list({
        pagination: { page: 1, limit: 1, order: "desc", orderBy: "createdAt" },
        filter: { plan: "premium", dateRange: { from: new Date(0), to: now } },
      }),
    ]);

    // Get revenue statistics
    const [totalRevenueResult, monthlyRevenueResult, yearlyRevenueResult] =
      await Promise.all([
        context.billingHistoryRepository.getTotalRevenue(),
        context.billingHistoryRepository.getRevenueByPeriod(startOfMonth, now),
        context.billingHistoryRepository.getRevenueByPeriod(startOfYear, now),
      ]);

    // Get usage statistics
    const [freeUsageResult, standardUsageResult, premiumUsageResult] =
      await Promise.all([
        context.usageMetricsRepository.getAggregatedUsageByPlan(
          "free",
          startOfMonth,
          now,
        ),
        context.usageMetricsRepository.getAggregatedUsageByPlan(
          "standard",
          startOfMonth,
          now,
        ),
        context.usageMetricsRepository.getAggregatedUsageByPlan(
          "premium",
          startOfMonth,
          now,
        ),
      ]);

    const statistics: SystemStatistics = {
      users: {
        total: allUsersResult.isOk() ? allUsersResult.value.count : 0,
        active: activeUsersResult.isOk() ? activeUsersResult.value.count : 0,
        suspended: suspendedUsersResult.isOk()
          ? suspendedUsersResult.value.count
          : 0,
        deleted: deletedUsersResult.isOk() ? deletedUsersResult.value.count : 0,
        byRole: {
          visitor: visitorUsersResult.isOk()
            ? visitorUsersResult.value.count
            : 0,
          editor: editorUsersResult.isOk() ? editorUsersResult.value.count : 0,
          admin: adminUsersResult.isOk() ? adminUsersResult.value.count : 0,
        },
        newThisMonth: newUsersThisMonthResult.isOk()
          ? newUsersThisMonthResult.value.count
          : 0,
        newThisWeek: newUsersThisWeekResult.isOk()
          ? newUsersThisWeekResult.value.count
          : 0,
      },
      content: {
        regions: {
          total: allRegionsResult.isOk() ? allRegionsResult.value.count : 0,
          published: publishedRegionsResult.isOk()
            ? publishedRegionsResult.value.count
            : 0,
          draft: draftRegionsResult.isOk() ? draftRegionsResult.value.count : 0,
          archived: archivedRegionsResult.isOk()
            ? archivedRegionsResult.value.count
            : 0,
        },
        places: {
          total: allPlacesResult.isOk() ? allPlacesResult.value.count : 0,
          published: publishedPlacesResult.isOk()
            ? publishedPlacesResult.value.count
            : 0,
          draft: draftPlacesResult.isOk() ? draftPlacesResult.value.count : 0,
          archived: archivedPlacesResult.isOk()
            ? archivedPlacesResult.value.count
            : 0,
        },
        checkins: {
          total: 0, // TODO: Implement checkin counting
          thisMonth: 0,
          thisWeek: 0,
        },
      },
      subscriptions: {
        total: allSubscriptionsResult.isOk()
          ? allSubscriptionsResult.value.count
          : 0,
        active: activeSubscriptionsResult.isOk()
          ? activeSubscriptionsResult.value.count
          : 0,
        trial: trialSubscriptionsResult.isOk()
          ? trialSubscriptionsResult.value.count
          : 0,
        expired: expiredSubscriptionsResult.isOk()
          ? expiredSubscriptionsResult.value.count
          : 0,
        cancelled: cancelledSubscriptionsResult.isOk()
          ? cancelledSubscriptionsResult.value.count
          : 0,
        byPlan: {
          free: freeSubscriptionsResult.isOk()
            ? freeSubscriptionsResult.value.count
            : 0,
          standard: standardSubscriptionsResult.isOk()
            ? standardSubscriptionsResult.value.count
            : 0,
          premium: premiumSubscriptionsResult.isOk()
            ? premiumSubscriptionsResult.value.count
            : 0,
        },
        revenue: {
          total: totalRevenueResult.isOk() ? totalRevenueResult.value : 0,
          thisMonth: monthlyRevenueResult.isOk()
            ? monthlyRevenueResult.value
            : 0,
          thisYear: yearlyRevenueResult.isOk() ? yearlyRevenueResult.value : 0,
        },
      },
      usage: {
        totalStorage:
          (freeUsageResult.isOk() ? freeUsageResult.value.storageUsedMB : 0) +
          (standardUsageResult.isOk()
            ? standardUsageResult.value.storageUsedMB
            : 0) +
          (premiumUsageResult.isOk()
            ? premiumUsageResult.value.storageUsedMB
            : 0),
        totalApiCalls:
          (freeUsageResult.isOk() ? freeUsageResult.value.apiCallsCount : 0) +
          (standardUsageResult.isOk()
            ? standardUsageResult.value.apiCallsCount
            : 0) +
          (premiumUsageResult.isOk()
            ? premiumUsageResult.value.apiCallsCount
            : 0),
        averageUsageByPlan: {
          free: {
            regions: freeUsageResult.isOk()
              ? freeUsageResult.value.regionsCreated
              : 0,
            places: freeUsageResult.isOk()
              ? freeUsageResult.value.placesCreated
              : 0,
            storage: freeUsageResult.isOk()
              ? freeUsageResult.value.storageUsedMB
              : 0,
          },
          standard: {
            regions: standardUsageResult.isOk()
              ? standardUsageResult.value.regionsCreated
              : 0,
            places: standardUsageResult.isOk()
              ? standardUsageResult.value.placesCreated
              : 0,
            storage: standardUsageResult.isOk()
              ? standardUsageResult.value.storageUsedMB
              : 0,
          },
          premium: {
            regions: premiumUsageResult.isOk()
              ? premiumUsageResult.value.regionsCreated
              : 0,
            places: premiumUsageResult.isOk()
              ? premiumUsageResult.value.placesCreated
              : 0,
            storage: premiumUsageResult.isOk()
              ? premiumUsageResult.value.storageUsedMB
              : 0,
          },
        },
      },
    };

    return ok(statistics);
  } catch (error) {
    return err(
      new SystemAnalyticsError(
        "Unexpected error getting system statistics",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get user growth data over time
 */
export async function getUserGrowthData(
  context: Context,
  adminUserId: string,
  _input: GetAnalyticsInput = { period: "month" },
): Promise<Result<UserGrowthData[], SystemAnalyticsError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // TODO: Implement actual user growth data collection
    // This would require historical data tracking and date-based queries
    // For now, return sample data structure

    const sampleData: UserGrowthData[] = [
      {
        period: new Date(),
        newUsers: 0,
        activeUsers: 0,
        totalUsers: 0,
        churnedUsers: 0,
        retentionRate: 0,
      },
    ];

    return ok(sampleData);
  } catch (error) {
    return err(
      new SystemAnalyticsError(
        "Unexpected error getting user growth data",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get revenue analytics over time
 */
export async function getRevenueAnalytics(
  context: Context,
  adminUserId: string,
  _input: GetAnalyticsInput = { period: "month" },
): Promise<Result<RevenueAnalytics[], SystemAnalyticsError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // TODO: Implement actual revenue analytics
    // This would require historical billing data and aggregation

    const sampleData: RevenueAnalytics[] = [
      {
        period: new Date(),
        revenue: 0,
        subscriptions: 0,
        averageRevenuePerUser: 0,
        newSubscriptions: 0,
        cancelledSubscriptions: 0,
      },
    ];

    return ok(sampleData);
  } catch (error) {
    return err(
      new SystemAnalyticsError(
        "Unexpected error getting revenue analytics",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Generate system health report
 */
export async function generateSystemHealthReport(
  context: Context,
  adminUserId: string,
): Promise<
  Result<
    {
      overallHealth: "excellent" | "good" | "warning" | "critical";
      issues: string[];
      recommendations: string[];
      statistics: SystemStatistics;
    },
    SystemAnalyticsError
  >
> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Get system statistics
    const statisticsResult = await getSystemStatistics(context, adminUserId);
    if (statisticsResult.isErr()) {
      return err(statisticsResult.error);
    }

    const statistics = statisticsResult.value;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze system health

    // Check user activity
    const userActivityRatio =
      statistics.users.total > 0
        ? statistics.users.active / statistics.users.total
        : 0;

    if (userActivityRatio < 0.3) {
      issues.push("Low user activity ratio");
      recommendations.push("Implement user engagement campaigns");
    }

    // Check content health
    const contentPublishRatio =
      statistics.content.regions.total + statistics.content.places.total > 0
        ? (statistics.content.regions.published +
            statistics.content.places.published) /
          (statistics.content.regions.total + statistics.content.places.total)
        : 0;

    if (contentPublishRatio < 0.5) {
      issues.push("Low content publish ratio");
      recommendations.push("Review content moderation and publishing workflow");
    }

    // Check subscription health
    const subscriptionConversionRatio =
      statistics.users.total > 0
        ? statistics.subscriptions.active / statistics.users.total
        : 0;

    if (subscriptionConversionRatio < 0.1) {
      issues.push("Low subscription conversion rate");
      recommendations.push("Review pricing strategy and subscription benefits");
    }

    // Determine overall health
    let overallHealth: "excellent" | "good" | "warning" | "critical";

    if (issues.length === 0) {
      overallHealth = "excellent";
    } else if (issues.length <= 2) {
      overallHealth = "good";
    } else if (issues.length <= 4) {
      overallHealth = "warning";
    } else {
      overallHealth = "critical";
    }

    return ok({
      overallHealth,
      issues,
      recommendations,
      statistics,
    });
  } catch (error) {
    return err(
      new SystemAnalyticsError(
        "Unexpected error generating system health report",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
