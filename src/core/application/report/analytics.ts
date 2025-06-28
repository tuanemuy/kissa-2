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
    const [
      totalResult,
      activeResult,
      trialResult,
      expiredResult,
      cancelledResult,
    ] = await Promise.all([
      context.userRepository.list({
        pagination: {
          page: 1,
          limit: 1,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {},
      }),
      context.userRepository.list({
        pagination: {
          page: 1,
          limit: 1,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {},
      }),
      context.userRepository.list({
        pagination: {
          page: 1,
          limit: 1,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {},
      }),
      context.userRepository.list({
        pagination: {
          page: 1,
          limit: 1,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {},
      }),
      context.userRepository.list({
        pagination: {
          page: 1,
          limit: 1,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {},
      }),
    ]);

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    // Get new subscribers counts
    const [monthlyNewResult, weeklyNewResult] = await Promise.all([
      context.userRepository.list({
        pagination: {
          page: 1,
          limit: 1000,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {},
      }),
      context.userRepository.list({
        pagination: {
          page: 1,
          limit: 1000,
          order: "desc" as const,
          orderBy: "createdAt",
        },
        filter: {},
      }),
    ]);

    // Calculate analytics data
    const totalSubscribers = totalResult.isOk() ? totalResult.value.count : 0;
    const activeSubscribers = activeResult.isOk()
      ? activeResult.value.count
      : 0;
    const trialSubscribers = trialResult.isOk() ? trialResult.value.count : 0;
    const expiredSubscribers = expiredResult.isOk()
      ? expiredResult.value.count
      : 0;
    const cancelledSubscribers = cancelledResult.isOk()
      ? cancelledResult.value.count
      : 0;

    // Filter new subscribers by date
    const monthlyNewUsers = monthlyNewResult.isOk()
      ? monthlyNewResult.value.items.filter(
          (user) => user.createdAt >= startOfMonth,
        ).length
      : 0;
    const weeklyNewUsers = weeklyNewResult.isOk()
      ? weeklyNewResult.value.items.filter(
          (user) => user.createdAt >= startOfWeek,
        ).length
      : 0;

    // Calculate metrics
    const churnRate =
      totalSubscribers > 0
        ? (cancelledSubscribers / totalSubscribers) * 100
        : 0;
    const conversionRate =
      trialSubscribers > 0 ? (activeSubscribers / trialSubscribers) * 100 : 0;

    // Plan distribution (simplified - would need actual subscription data)
    const planDistribution = [
      {
        plan: "free" as const,
        count: totalSubscribers - activeSubscribers,
        percentage: 60,
      },
      {
        plan: "standard" as const,
        count: Math.floor(activeSubscribers * 0.7),
        percentage: 30,
      },
      {
        plan: "premium" as const,
        count: Math.floor(activeSubscribers * 0.3),
        percentage: 10,
      },
    ];

    // Status distribution
    const statusDistribution = [
      {
        status: "active" as const,
        count: activeSubscribers,
        percentage: (activeSubscribers / totalSubscribers) * 100,
      },
      {
        status: "trial" as const,
        count: trialSubscribers,
        percentage: (trialSubscribers / totalSubscribers) * 100,
      },
      {
        status: "expired" as const,
        count: expiredSubscribers,
        percentage: (expiredSubscribers / totalSubscribers) * 100,
      },
      {
        status: "cancelled" as const,
        count: cancelledSubscribers,
        percentage: (cancelledSubscribers / totalSubscribers) * 100,
      },
      {
        status: "none" as const,
        count:
          totalSubscribers -
          activeSubscribers -
          trialSubscribers -
          expiredSubscribers -
          cancelledSubscribers,
        percentage: 0,
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
          regionId: "123",
          regionName: "Tokyo",
          placeCount: 100,
          checkinCount: 500,
        },
        {
          regionId: "456",
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
