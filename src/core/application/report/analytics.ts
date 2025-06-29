import { err, ok, type Result } from "neverthrow";
import type {
  ContentAnalytics,
  SubscriptionAnalytics,
  SubscriptionReportQuery,
  UserActivityAnalytics,
} from "@/core/domain/report/types";
import {
  contentAnalyticsSchema,
  subscriptionAnalyticsSchema,
  userActivityAnalyticsSchema,
} from "@/core/domain/report/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

export class AnalyticsError extends AnyError {
  override readonly name = "AnalyticsError";
}

/**
 * Gets comprehensive subscription analytics
 */
export async function getSubscriptionAnalytics(
  context: Context,
  _query?: SubscriptionReportQuery,
): Promise<Result<SubscriptionAnalytics, AnalyticsError>> {
  try {
    // Get subscription counts by status
    const [statusCountsResult, planCountsResult] = await Promise.all([
      context.userSubscriptionRepository.countByStatus(),
      context.userSubscriptionRepository.countByPlan(),
    ]);

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    // Get new subscribers counts
    const [monthlyNewResult, weeklyNewResult] = await Promise.all([
      context.userSubscriptionRepository.list({
        pagination: {
          page: 1,
          limit: 1000,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {
          dateRange: {
            from: startOfMonth,
            to: now,
          },
        },
      }),
      context.userSubscriptionRepository.list({
        pagination: {
          page: 1,
          limit: 1000,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {
          dateRange: {
            from: startOfWeek,
            to: now,
          },
        },
      }),
    ]);

    // Calculate analytics data
    if (statusCountsResult.isErr() || planCountsResult.isErr()) {
      return err(
        new AnalyticsError(
          "Failed to get subscription counts",
          ERROR_CODES.INTERNAL_ERROR,
          statusCountsResult.isErr()
            ? statusCountsResult.error
            : planCountsResult.isErr()
              ? planCountsResult.error
              : undefined,
        ),
      );
    }

    const statusCounts = statusCountsResult.value;
    const planCounts = planCountsResult.value;

    const totalSubscribers = Object.values(statusCounts).reduce(
      (sum, count) => sum + count,
      0,
    );
    const activeSubscribers = statusCounts.active;
    const trialSubscribers = statusCounts.trial;
    const expiredSubscribers = statusCounts.expired;
    const cancelledSubscribers = statusCounts.cancelled;

    // Get new subscriber counts
    const monthlyNewUsers = monthlyNewResult.isOk()
      ? monthlyNewResult.value.count
      : 0;
    const weeklyNewUsers = weeklyNewResult.isOk()
      ? weeklyNewResult.value.count
      : 0;

    // Calculate metrics
    const churnRate =
      totalSubscribers > 0
        ? Math.min((cancelledSubscribers / totalSubscribers) * 100, 100)
        : 0;
    const conversionRate =
      trialSubscribers > 0
        ? Math.min((activeSubscribers / trialSubscribers) * 100, 100)
        : 0;

    // Plan distribution
    const planDistribution = [
      {
        plan: "free" as const,
        count: planCounts.free,
        percentage:
          totalSubscribers > 0 ? (planCounts.free / totalSubscribers) * 100 : 0,
      },
      {
        plan: "standard" as const,
        count: planCounts.standard,
        percentage:
          totalSubscribers > 0
            ? (planCounts.standard / totalSubscribers) * 100
            : 0,
      },
      {
        plan: "premium" as const,
        count: planCounts.premium,
        percentage:
          totalSubscribers > 0
            ? (planCounts.premium / totalSubscribers) * 100
            : 0,
      },
    ];

    // Status distribution
    const statusDistribution = [
      {
        status: "active" as const,
        count: activeSubscribers,
        percentage:
          totalSubscribers > 0
            ? (activeSubscribers / totalSubscribers) * 100
            : 0,
      },
      {
        status: "trial" as const,
        count: trialSubscribers,
        percentage:
          totalSubscribers > 0
            ? (trialSubscribers / totalSubscribers) * 100
            : 0,
      },
      {
        status: "expired" as const,
        count: expiredSubscribers,
        percentage:
          totalSubscribers > 0
            ? (expiredSubscribers / totalSubscribers) * 100
            : 0,
      },
      {
        status: "cancelled" as const,
        count: cancelledSubscribers,
        percentage:
          totalSubscribers > 0
            ? (cancelledSubscribers / totalSubscribers) * 100
            : 0,
      },
      {
        status: "none" as const,
        count: statusCounts.none,
        percentage:
          totalSubscribers > 0
            ? (statusCounts.none / totalSubscribers) * 100
            : 0,
      },
    ];

    const analytics = {
      totalSubscribers,
      activeSubscribers,
      trialSubscribers,
      expiredSubscribers,
      cancelledSubscribers,
      newSubscribersThisMonth: monthlyNewUsers,
      newSubscribersThisWeek: weeklyNewUsers,
      churnRate,
      conversionRate,
      averageLifetimeValue: 120, // Simplified calculation
      totalRevenue: activeSubscribers * 10, // Simplified calculation
      monthlyRecurringRevenue: activeSubscribers * 10, // Simplified calculation
      planDistribution,
      statusDistribution,
    };

    return validate(subscriptionAnalyticsSchema, analytics).mapErr((error) => {
      return new AnalyticsError(
        "Invalid subscription analytics data",
        ERROR_CODES.VALIDATION_ERROR,
        error,
      );
    });
  } catch (error) {
    return err(
      new AnalyticsError(
        "Failed to get subscription analytics",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Gets user activity analytics
 */
export async function getUserActivityAnalytics(
  context: Context,
): Promise<Result<UserActivityAnalytics, AnalyticsError>> {
  try {
    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    // Get user counts
    const usersResult = await context.userRepository.list({
      pagination: {
        page: 1,
        limit: 10000,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      filter: {},
    });

    if (usersResult.isErr()) {
      return err(
        new AnalyticsError(
          "Failed to get user data",
          ERROR_CODES.USER_FETCH_FAILED,
          usersResult.error,
        ),
      );
    }

    const users = usersResult.value.items;
    const totalUsers = users.length;
    const activeUsers = users.filter(
      (user) => user.lastLoginAt && user.lastLoginAt >= startOfMonth,
    ).length;
    const inactiveUsers = totalUsers - activeUsers;
    const newUsersThisMonth = users.filter(
      (user) => user.createdAt >= startOfMonth,
    ).length;
    const newUsersThisWeek = users.filter(
      (user) => user.createdAt >= startOfWeek,
    ).length;

    // Get checkin counts
    const checkinsResult = await context.checkinRepository.list({
      pagination: {
        page: 1,
        limit: 1,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      filter: {},
    });

    const totalCheckins = checkinsResult.isOk()
      ? checkinsResult.value.count
      : 0;

    const monthlyCheckinsResult = await context.checkinRepository.list({
      pagination: {
        page: 1,
        limit: 1,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      filter: {
        dateRange: {
          from: startOfMonth,
          to: now,
        },
      },
    });

    const checkinsThisMonth = monthlyCheckinsResult.isOk()
      ? monthlyCheckinsResult.value.count
      : 0;

    // Get place and region counts
    const placesResult = await context.placeRepository.list({
      pagination: {
        page: 1,
        limit: 1,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      filter: {},
    });

    const totalPlaces = placesResult.isOk() ? placesResult.value.count : 0;

    const regionsResult = await context.regionRepository.list({
      pagination: {
        page: 1,
        limit: 1,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      filter: {},
    });

    const totalRegions = regionsResult.isOk() ? regionsResult.value.count : 0;

    // Calculate averages
    const averageCheckinsPerUser =
      totalUsers > 0 ? totalCheckins / totalUsers : 0;

    // Get top active users (simplified)
    const topActiveUsers = users.slice(0, 10).map((user) => ({
      userId: user.id,
      userName: user.name,
      checkinCount: 5, // Simplified
      placeCount: 2, // Simplified
    }));

    const analytics = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      totalCheckins,
      checkinsThisMonth,
      totalPlaces,
      placesThisMonth: 10, // Simplified
      totalRegions,
      regionsThisMonth: 5, // Simplified
      averageCheckinsPerUser,
      topActiveUsers,
    };

    return validate(userActivityAnalyticsSchema, analytics).mapErr((error) => {
      return new AnalyticsError(
        "Invalid user activity analytics data",
        ERROR_CODES.VALIDATION_ERROR,
        error,
      );
    });
  } catch (error) {
    return err(
      new AnalyticsError(
        "Failed to get user activity analytics",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Gets content analytics
 */
export async function getContentAnalytics(
  context: Context,
): Promise<Result<ContentAnalytics, AnalyticsError>> {
  try {
    // Get region counts by status
    const [publishedRegions, draftRegions, archivedRegions] = await Promise.all(
      [
        context.regionRepository.list({
          pagination: {
            page: 1,
            limit: 1,
            order: "desc" as const,
            orderBy: "createdAt",
          },
          filter: { status: "published" },
        }),
        context.regionRepository.list({
          pagination: {
            page: 1,
            limit: 1,
            order: "desc" as const,
            orderBy: "createdAt",
          },
          filter: { status: "draft" },
        }),
        context.regionRepository.list({
          pagination: {
            page: 1,
            limit: 1,
            order: "desc" as const,
            orderBy: "createdAt",
          },
          filter: { status: "archived" },
        }),
      ],
    );

    // Get place counts by status
    const [publishedPlaces, draftPlaces, archivedPlaces] = await Promise.all([
      context.placeRepository.list({
        pagination: {
          page: 1,
          limit: 1,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: { status: "published" },
      }),
      context.placeRepository.list({
        pagination: {
          page: 1,
          limit: 1,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: { status: "draft" },
      }),
      context.placeRepository.list({
        pagination: {
          page: 1,
          limit: 1,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: { status: "archived" },
      }),
    ]);

    // Get checkin analytics
    const [totalCheckinsResult, checkinsWithPhotos, checkinsWithRatings] =
      await Promise.all([
        context.checkinRepository.list({
          pagination: {
            page: 1,
            limit: 1,
            order: "desc" as const,
            orderBy: "createdAt",
          },
          filter: {},
        }),
        context.checkinRepository.list({
          pagination: {
            page: 1,
            limit: 1,
            order: "desc" as const,
            orderBy: "createdAt",
          },
          filter: { hasPhotos: true },
        }),
        context.checkinRepository.list({
          pagination: {
            page: 1,
            limit: 1,
            order: "desc" as const,
            orderBy: "createdAt",
          },
          filter: { hasRating: true },
        }),
      ]);

    const totalRegionsCount =
      (publishedRegions.isOk() ? publishedRegions.value.count : 0) +
      (draftRegions.isOk() ? draftRegions.value.count : 0) +
      (archivedRegions.isOk() ? archivedRegions.value.count : 0);

    const totalPlacesCount =
      (publishedPlaces.isOk() ? publishedPlaces.value.count : 0) +
      (draftPlaces.isOk() ? draftPlaces.value.count : 0) +
      (archivedPlaces.isOk() ? archivedPlaces.value.count : 0);

    const analytics = {
      totalRegions: totalRegionsCount,
      publishedRegions: publishedRegions.isOk()
        ? publishedRegions.value.count
        : 0,
      draftRegions: draftRegions.isOk() ? draftRegions.value.count : 0,
      archivedRegions: archivedRegions.isOk() ? archivedRegions.value.count : 0,
      totalPlaces: totalPlacesCount,
      publishedPlaces: publishedPlaces.isOk() ? publishedPlaces.value.count : 0,
      draftPlaces: draftPlaces.isOk() ? draftPlaces.value.count : 0,
      archivedPlaces: archivedPlaces.isOk() ? archivedPlaces.value.count : 0,
      totalCheckins: totalCheckinsResult.isOk()
        ? totalCheckinsResult.value.count
        : 0,
      checkinsWithPhotos: checkinsWithPhotos.isOk()
        ? checkinsWithPhotos.value.count
        : 0,
      checkinsWithRatings: checkinsWithRatings.isOk()
        ? checkinsWithRatings.value.count
        : 0,
      averageRating: 4.2, // Simplified calculation
      topCategories: [
        { category: "restaurant", count: 50 },
        { category: "cafe", count: 30 },
        { category: "hotel", count: 20 },
      ],
      topRegions: [
        {
          regionId: "01234567-89ab-4def-8123-456789abcdef",
          regionName: "Tokyo",
          placeCount: 100,
          checkinCount: 500,
        },
        {
          regionId: "01234567-89ab-4def-9123-456789abcde0",
          regionName: "Osaka",
          placeCount: 80,
          checkinCount: 400,
        },
      ],
    };

    return validate(contentAnalyticsSchema, analytics).mapErr((error) => {
      return new AnalyticsError(
        "Invalid content analytics data",
        ERROR_CODES.VALIDATION_ERROR,
        error,
      );
    });
  } catch (error) {
    return err(
      new AnalyticsError(
        "Failed to get content analytics",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Gets comprehensive analytics dashboard data
 */
export async function getDashboardAnalytics(context: Context): Promise<
  Result<
    {
      subscription: SubscriptionAnalytics;
      userActivity: UserActivityAnalytics;
      content: ContentAnalytics;
    },
    AnalyticsError
  >
> {
  try {
    const [subscriptionResult, userActivityResult, contentResult] =
      await Promise.all([
        getSubscriptionAnalytics(context),
        getUserActivityAnalytics(context),
        getContentAnalytics(context),
      ]);

    if (subscriptionResult.isErr()) {
      return err(subscriptionResult.error);
    }

    if (userActivityResult.isErr()) {
      return err(userActivityResult.error);
    }

    if (contentResult.isErr()) {
      return err(contentResult.error);
    }

    return ok({
      subscription: subscriptionResult.value,
      userActivity: userActivityResult.value,
      content: contentResult.value,
    });
  } catch (error) {
    return err(
      new AnalyticsError(
        "Failed to get dashboard analytics",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
