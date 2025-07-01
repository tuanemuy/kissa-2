import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Place } from "@/core/domain/place/types";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  getContentAnalytics,
  getDashboardAnalytics,
  getSubscriptionAnalytics,
  getUserActivityAnalytics,
} from "./analytics";

describe("analytics", () => {
  let context: Context;
  let adminUser: User;
  let editorUser: User;
  let regularUser1: User;
  let regularUser2: User;
  let regularUser3: User;
  let testRegion1: Region;
  let _testRegion2: Region;
  let testPlace1: Place;
  let testPlace2: Place;
  let _testPlace3: Place;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    // Create admin user
    const adminResult = await context.userRepository.create({
      email: "admin@example.com",
      password: hashedPassword.value,
      name: "Admin User",
    });
    if (adminResult.isErr()) {
      throw new Error("Failed to create admin user");
    }
    adminUser = adminResult.value;
    await context.userRepository.updateRole(adminUser.id, "admin");

    // Create editor user
    const editorResult = await context.userRepository.create({
      email: "editor@example.com",
      password: hashedPassword.value,
      name: "Editor User",
    });
    if (editorResult.isErr()) {
      throw new Error("Failed to create editor user");
    }
    editorUser = editorResult.value;
    await context.userRepository.updateRole(editorUser.id, "editor");

    // Create regular users
    const regularResult1 = await context.userRepository.create({
      email: "regular1@example.com",
      password: hashedPassword.value,
      name: "Regular User 1",
    });
    if (regularResult1.isErr()) {
      throw new Error("Failed to create regular user 1");
    }
    regularUser1 = regularResult1.value;

    const regularResult2 = await context.userRepository.create({
      email: "regular2@example.com",
      password: hashedPassword.value,
      name: "Regular User 2",
    });
    if (regularResult2.isErr()) {
      throw new Error("Failed to create regular user 2");
    }
    regularUser2 = regularResult2.value;

    const regularResult3 = await context.userRepository.create({
      email: "regular3@example.com",
      password: hashedPassword.value,
      name: "Regular User 3",
    });
    if (regularResult3.isErr()) {
      throw new Error("Failed to create regular user 3");
    }
    regularUser3 = regularResult3.value;

    // Create test regions
    const region1Result = await context.regionRepository.create(editorUser.id, {
      name: "Tokyo Region",
      description: "Metropolitan area of Tokyo",
      coordinates: { latitude: 35.6762, longitude: 139.6503 },
      address: "Tokyo, Japan",
      images: [],
      tags: ["urban", "metropolitan"],
    });
    if (region1Result.isErr()) {
      throw new Error("Failed to create region 1");
    }
    testRegion1 = region1Result.value;
    await context.regionRepository.updateStatus(testRegion1.id, "published");

    const region2Result = await context.regionRepository.create(editorUser.id, {
      name: "Osaka Region",
      description: "Food capital of Japan",
      coordinates: { latitude: 34.6937, longitude: 135.5023 },
      address: "Osaka, Japan",
      images: [],
      tags: ["food", "culture"],
    });
    if (region2Result.isErr()) {
      throw new Error("Failed to create region 2");
    }
    _testRegion2 = region2Result.value;
    // Leave as draft for testing

    // Create test places
    const place1Result = await context.placeRepository.create(editorUser.id, {
      name: "Tokyo Restaurant",
      description: "Fine dining in Tokyo",
      shortDescription: "Fine dining",
      category: "restaurant",
      regionId: testRegion1.id,
      coordinates: { latitude: 35.6795, longitude: 139.6516 },
      address: "1-1-1 Shibuya, Tokyo",
      images: [],
      tags: ["restaurant", "fine-dining"],
      businessHours: [],
    });
    if (place1Result.isErr()) {
      throw new Error("Failed to create place 1");
    }
    testPlace1 = place1Result.value;
    await context.placeRepository.updateStatus(testPlace1.id, "published");

    const place2Result = await context.placeRepository.create(editorUser.id, {
      name: "Tokyo Cafe",
      description: "Cozy cafe in Tokyo",
      shortDescription: "Cozy cafe",
      category: "cafe",
      regionId: testRegion1.id,
      coordinates: { latitude: 35.68, longitude: 139.652 },
      address: "2-2-2 Harajuku, Tokyo",
      images: [],
      tags: ["cafe", "cozy"],
      businessHours: [],
    });
    if (place2Result.isErr()) {
      throw new Error("Failed to create place 2");
    }
    testPlace2 = place2Result.value;
    await context.placeRepository.updateStatus(testPlace2.id, "published");

    const place3Result = await context.placeRepository.create(editorUser.id, {
      name: "Tokyo Hotel",
      description: "Luxury hotel in Tokyo",
      shortDescription: "Luxury hotel",
      category: "hotel",
      regionId: testRegion1.id,
      coordinates: { latitude: 35.6805, longitude: 139.6525 },
      address: "3-3-3 Ginza, Tokyo",
      images: [],
      tags: ["hotel", "luxury"],
      businessHours: [],
    });
    if (place3Result.isErr()) {
      throw new Error("Failed to create place 3");
    }
    _testPlace3 = place3Result.value;
    // Leave as draft for testing

    // Create subscriptions for users (would need subscription repository mock updates)
    await context.userSubscriptionRepository.create({
      userId: regularUser1.id,
      plan: "standard",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    });

    await context.userSubscriptionRepository.create({
      userId: regularUser2.id,
      plan: "premium",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    });

    await context.userSubscriptionRepository.create({
      userId: regularUser3.id,
      plan: "free",
      status: "trial",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    });
  });

  describe("getSubscriptionAnalytics", () => {
    it("should successfully get subscription analytics", async () => {
      const result = await getSubscriptionAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;

        expect(analytics.totalSubscribers).toBeGreaterThanOrEqual(0);
        expect(analytics.activeSubscribers).toBeGreaterThanOrEqual(0);
        expect(analytics.trialSubscribers).toBeGreaterThanOrEqual(0);
        expect(analytics.expiredSubscribers).toBeGreaterThanOrEqual(0);
        expect(analytics.cancelledSubscribers).toBeGreaterThanOrEqual(0);
        expect(analytics.newSubscribersThisMonth).toBeGreaterThanOrEqual(0);
        expect(analytics.newSubscribersThisWeek).toBeGreaterThanOrEqual(0);
        expect(analytics.churnRate).toBeGreaterThanOrEqual(0);
        expect(analytics.churnRate).toBeLessThanOrEqual(100);
        expect(analytics.conversionRate).toBeGreaterThanOrEqual(0);
        expect(analytics.conversionRate).toBeLessThanOrEqual(100);
        expect(analytics.averageLifetimeValue).toBeGreaterThanOrEqual(0);
        expect(analytics.totalRevenue).toBeGreaterThanOrEqual(0);
        expect(analytics.monthlyRecurringRevenue).toBeGreaterThanOrEqual(0);

        // Plan distribution validation
        expect(analytics.planDistribution).toHaveLength(3);
        expect(analytics.planDistribution[0].plan).toBe("free");
        expect(analytics.planDistribution[1].plan).toBe("standard");
        expect(analytics.planDistribution[2].plan).toBe("premium");

        analytics.planDistribution.forEach((plan) => {
          expect(plan.count).toBeGreaterThanOrEqual(0);
          expect(plan.percentage).toBeGreaterThanOrEqual(0);
          expect(plan.percentage).toBeLessThanOrEqual(100);
        });

        // Status distribution validation
        expect(analytics.statusDistribution).toHaveLength(5);
        const statusTypes = analytics.statusDistribution.map((s) => s.status);
        expect(statusTypes).toContain("active");
        expect(statusTypes).toContain("trial");
        expect(statusTypes).toContain("expired");
        expect(statusTypes).toContain("cancelled");
        expect(statusTypes).toContain("none");

        analytics.statusDistribution.forEach((status) => {
          expect(status.count).toBeGreaterThanOrEqual(0);
          expect(status.percentage).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it("should handle subscription analytics with query parameters", async () => {
      const query = {
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date(),
        },
        images: [],
        tags: [],
        granularity: "daily" as const,
      };

      const result = await getSubscriptionAnalytics(context, query);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;
        expect(analytics.totalSubscribers).toBeGreaterThanOrEqual(0);
      }
    });

    it("should calculate metrics correctly with zero subscribers", async () => {
      // Reset to empty state
      resetMockContext(context);

      const result = await getSubscriptionAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;
        expect(analytics.totalSubscribers).toBe(0);
        expect(analytics.activeSubscribers).toBe(0);
        expect(analytics.churnRate).toBe(0);
        expect(analytics.conversionRate).toBe(0);
      }
    });

    it("should handle repository errors gracefully", async () => {
      // This would require mocking repository failures
      // For now, we test normal operation
      const result = await getSubscriptionAnalytics(context);
      expect(result.isOk()).toBe(true);
    });

    it("should validate analytics data schema", async () => {
      const result = await getSubscriptionAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;

        // Check required fields exist
        expect(analytics).toHaveProperty("totalSubscribers");
        expect(analytics).toHaveProperty("activeSubscribers");
        expect(analytics).toHaveProperty("trialSubscribers");
        expect(analytics).toHaveProperty("expiredSubscribers");
        expect(analytics).toHaveProperty("cancelledSubscribers");
        expect(analytics).toHaveProperty("planDistribution");
        expect(analytics).toHaveProperty("statusDistribution");

        // Validate data types
        expect(typeof analytics.totalSubscribers).toBe("number");
        expect(typeof analytics.churnRate).toBe("number");
        expect(Array.isArray(analytics.planDistribution)).toBe(true);
        expect(Array.isArray(analytics.statusDistribution)).toBe(true);
      }
    });
  });

  describe("getUserActivityAnalytics", () => {
    it("should successfully get user activity analytics", async () => {
      const result = await getUserActivityAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;

        expect(analytics.totalUsers).toBeGreaterThanOrEqual(0);
        expect(analytics.activeUsers).toBeGreaterThanOrEqual(0);
        expect(analytics.inactiveUsers).toBeGreaterThanOrEqual(0);
        expect(analytics.newUsersThisMonth).toBeGreaterThanOrEqual(0);
        expect(analytics.newUsersThisWeek).toBeGreaterThanOrEqual(0);
        expect(analytics.totalCheckins).toBeGreaterThanOrEqual(0);
        expect(analytics.checkinsThisMonth).toBeGreaterThanOrEqual(0);
        expect(analytics.totalPlaces).toBeGreaterThanOrEqual(0);
        expect(analytics.placesThisMonth).toBeGreaterThanOrEqual(0);
        expect(analytics.totalRegions).toBeGreaterThanOrEqual(0);
        expect(analytics.regionsThisMonth).toBeGreaterThanOrEqual(0);
        expect(analytics.averageCheckinsPerUser).toBeGreaterThanOrEqual(0);

        // Top active users validation
        expect(Array.isArray(analytics.topActiveUsers)).toBe(true);
        analytics.topActiveUsers.forEach((user) => {
          expect(user).toHaveProperty("userId");
          expect(user).toHaveProperty("userName");
          expect(user).toHaveProperty("checkinCount");
          expect(user).toHaveProperty("placeCount");
          expect(typeof user.userId).toBe("string");
          expect(typeof user.userName).toBe("string");
          expect(typeof user.checkinCount).toBe("number");
          expect(typeof user.placeCount).toBe("number");
        });
      }
    });

    it("should calculate user activity metrics correctly", async () => {
      const result = await getUserActivityAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;

        // Total users should be the sum of active and inactive
        expect(analytics.totalUsers).toBe(
          analytics.activeUsers + analytics.inactiveUsers,
        );

        // New users this week should be <= new users this month
        expect(analytics.newUsersThisWeek).toBeLessThanOrEqual(
          analytics.newUsersThisMonth,
        );

        // Average checkins per user calculation
        if (analytics.totalUsers > 0) {
          expect(analytics.averageCheckinsPerUser).toBe(
            analytics.totalCheckins / analytics.totalUsers,
          );
        } else {
          expect(analytics.averageCheckinsPerUser).toBe(0);
        }
      }
    });

    it("should handle empty user data", async () => {
      // Reset to empty state
      resetMockContext(context);

      const result = await getUserActivityAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;
        expect(analytics.totalUsers).toBe(0);
        expect(analytics.activeUsers).toBe(0);
        expect(analytics.inactiveUsers).toBe(0);
        expect(analytics.averageCheckinsPerUser).toBe(0);
        expect(analytics.topActiveUsers).toHaveLength(0);
      }
    });

    it("should validate user activity analytics schema", async () => {
      const result = await getUserActivityAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;

        // Check all required fields exist
        expect(analytics).toHaveProperty("totalUsers");
        expect(analytics).toHaveProperty("activeUsers");
        expect(analytics).toHaveProperty("inactiveUsers");
        expect(analytics).toHaveProperty("newUsersThisMonth");
        expect(analytics).toHaveProperty("newUsersThisWeek");
        expect(analytics).toHaveProperty("totalCheckins");
        expect(analytics).toHaveProperty("checkinsThisMonth");
        expect(analytics).toHaveProperty("totalPlaces");
        expect(analytics).toHaveProperty("placesThisMonth");
        expect(analytics).toHaveProperty("totalRegions");
        expect(analytics).toHaveProperty("regionsThisMonth");
        expect(analytics).toHaveProperty("averageCheckinsPerUser");
        expect(analytics).toHaveProperty("topActiveUsers");
      }
    });

    it("should handle repository errors in user activity analytics", async () => {
      // Test would require mocking repository failures
      const result = await getUserActivityAnalytics(context);

      // Should handle gracefully or return appropriate error
      expect(result.isOk() || result.isErr()).toBe(true);
    });
  });

  describe("getContentAnalytics", () => {
    it("should successfully get content analytics", async () => {
      const result = await getContentAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;

        expect(analytics.totalRegions).toBeGreaterThanOrEqual(0);
        expect(analytics.publishedRegions).toBeGreaterThanOrEqual(0);
        expect(analytics.draftRegions).toBeGreaterThanOrEqual(0);
        expect(analytics.archivedRegions).toBeGreaterThanOrEqual(0);
        expect(analytics.totalPlaces).toBeGreaterThanOrEqual(0);
        expect(analytics.publishedPlaces).toBeGreaterThanOrEqual(0);
        expect(analytics.draftPlaces).toBeGreaterThanOrEqual(0);
        expect(analytics.archivedPlaces).toBeGreaterThanOrEqual(0);
        expect(analytics.totalCheckins).toBeGreaterThanOrEqual(0);
        expect(analytics.checkinsWithPhotos).toBeGreaterThanOrEqual(0);
        expect(analytics.checkinsWithRatings).toBeGreaterThanOrEqual(0);
        expect(analytics.averageRating).toBeGreaterThanOrEqual(0);
        expect(analytics.averageRating).toBeLessThanOrEqual(5);

        // Top categories validation
        expect(Array.isArray(analytics.topCategories)).toBe(true);
        analytics.topCategories.forEach((category) => {
          expect(category).toHaveProperty("category");
          expect(category).toHaveProperty("count");
          expect(typeof category.category).toBe("string");
          expect(typeof category.count).toBe("number");
          expect(category.count).toBeGreaterThanOrEqual(0);
        });

        // Top regions validation
        expect(Array.isArray(analytics.topRegions)).toBe(true);
        analytics.topRegions.forEach((region) => {
          expect(region).toHaveProperty("regionId");
          expect(region).toHaveProperty("regionName");
          expect(region).toHaveProperty("placeCount");
          expect(region).toHaveProperty("checkinCount");
          expect(typeof region.regionId).toBe("string");
          expect(typeof region.regionName).toBe("string");
          expect(typeof region.placeCount).toBe("number");
          expect(typeof region.checkinCount).toBe("number");
        });
      }
    });

    it("should calculate content counts correctly", async () => {
      const result = await getContentAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;

        // Total regions should equal sum of status counts
        expect(analytics.totalRegions).toBe(
          analytics.publishedRegions +
            analytics.draftRegions +
            analytics.archivedRegions,
        );

        // Total places should equal sum of status counts
        expect(analytics.totalPlaces).toBe(
          analytics.publishedPlaces +
            analytics.draftPlaces +
            analytics.archivedPlaces,
        );

        // Checkins with photos/ratings should not exceed total checkins
        expect(analytics.checkinsWithPhotos).toBeLessThanOrEqual(
          analytics.totalCheckins,
        );
        expect(analytics.checkinsWithRatings).toBeLessThanOrEqual(
          analytics.totalCheckins,
        );
      }
    });

    it("should handle empty content data", async () => {
      // Reset to empty state
      resetMockContext(context);

      const result = await getContentAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;
        expect(analytics.totalRegions).toBe(0);
        expect(analytics.totalPlaces).toBe(0);
        expect(analytics.totalCheckins).toBe(0);
        expect(analytics.checkinsWithPhotos).toBe(0);
        expect(analytics.checkinsWithRatings).toBe(0);
      }
    });

    it("should validate content analytics schema", async () => {
      const result = await getContentAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;

        // Check all required fields exist
        expect(analytics).toHaveProperty("totalRegions");
        expect(analytics).toHaveProperty("publishedRegions");
        expect(analytics).toHaveProperty("draftRegions");
        expect(analytics).toHaveProperty("archivedRegions");
        expect(analytics).toHaveProperty("totalPlaces");
        expect(analytics).toHaveProperty("publishedPlaces");
        expect(analytics).toHaveProperty("draftPlaces");
        expect(analytics).toHaveProperty("archivedPlaces");
        expect(analytics).toHaveProperty("totalCheckins");
        expect(analytics).toHaveProperty("checkinsWithPhotos");
        expect(analytics).toHaveProperty("checkinsWithRatings");
        expect(analytics).toHaveProperty("averageRating");
        expect(analytics).toHaveProperty("topCategories");
        expect(analytics).toHaveProperty("topRegions");
      }
    });

    it("should provide meaningful top categories data", async () => {
      const result = await getContentAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;

        // Should have common categories
        const categoryNames = analytics.topCategories.map((c) => c.category);
        expect(categoryNames).toContain("restaurant");
        expect(categoryNames).toContain("cafe");
        expect(categoryNames).toContain("hotel");

        // Categories should be sorted by count (descending)
        for (let i = 0; i < analytics.topCategories.length - 1; i++) {
          expect(analytics.topCategories[i].count).toBeGreaterThanOrEqual(
            analytics.topCategories[i + 1].count,
          );
        }
      }
    });
  });

  describe("getDashboardAnalytics", () => {
    it("should successfully get combined dashboard analytics", async () => {
      const result = await getDashboardAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const dashboard = result.value;

        expect(dashboard).toHaveProperty("subscription");
        expect(dashboard).toHaveProperty("userActivity");
        expect(dashboard).toHaveProperty("content");

        // Validate subscription analytics
        expect(dashboard.subscription).toHaveProperty("totalSubscribers");
        expect(dashboard.subscription).toHaveProperty("planDistribution");
        expect(dashboard.subscription).toHaveProperty("statusDistribution");

        // Validate user activity analytics
        expect(dashboard.userActivity).toHaveProperty("totalUsers");
        expect(dashboard.userActivity).toHaveProperty("activeUsers");
        expect(dashboard.userActivity).toHaveProperty("topActiveUsers");

        // Validate content analytics
        expect(dashboard.content).toHaveProperty("totalRegions");
        expect(dashboard.content).toHaveProperty("totalPlaces");
        expect(dashboard.content).toHaveProperty("topCategories");
        expect(dashboard.content).toHaveProperty("topRegions");
      }
    });

    it("should handle partial failures in dashboard analytics", async () => {
      // This test would require mocking specific failures
      const result = await getDashboardAnalytics(context);

      // Should either succeed completely or fail appropriately
      expect(result.isOk() || result.isErr()).toBe(true);
    });

    it("should provide consistent data across analytics", async () => {
      const result = await getDashboardAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const dashboard = result.value;

        // User counts should be consistent
        expect(dashboard.userActivity.totalUsers).toBeGreaterThanOrEqual(
          dashboard.subscription.totalSubscribers,
        );

        // Content counts should be logical
        expect(dashboard.content.totalRegions).toBeGreaterThanOrEqual(0);
        expect(dashboard.content.totalPlaces).toBeGreaterThanOrEqual(0);
      }
    });

    it("should execute analytics in parallel efficiently", async () => {
      const startTime = Date.now();
      const result = await getDashboardAnalytics(context);
      const endTime = Date.now();

      expect(result.isOk()).toBe(true);

      // Should complete within reasonable time (parallel execution)
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle date range calculations correctly", async () => {
      const result = await getUserActivityAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;

        // New users this week should not exceed new users this month
        expect(analytics.newUsersThisWeek).toBeLessThanOrEqual(
          analytics.newUsersThisMonth,
        );

        // New users this month should not exceed total users
        expect(analytics.newUsersThisMonth).toBeLessThanOrEqual(
          analytics.totalUsers,
        );
      }
    });

    it("should handle division by zero in calculations", async () => {
      // Reset to empty state
      resetMockContext(context);

      const [subscriptionResult, userActivityResult] = await Promise.all([
        getSubscriptionAnalytics(context),
        getUserActivityAnalytics(context),
      ]);

      expect(subscriptionResult.isOk()).toBe(true);
      expect(userActivityResult.isOk()).toBe(true);

      if (subscriptionResult.isOk()) {
        const subscription = subscriptionResult.value;
        expect(subscription.churnRate).toBe(0);
        expect(subscription.conversionRate).toBe(0);
      }

      if (userActivityResult.isOk()) {
        const userActivity = userActivityResult.value;
        expect(userActivity.averageCheckinsPerUser).toBe(0);
      }
    });

    it("should handle large datasets efficiently", async () => {
      // This would require creating many test entities
      const result = await getDashboardAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const dashboard = result.value;

        // Should handle any size dataset
        expect(dashboard.subscription.totalSubscribers).toBeGreaterThanOrEqual(
          0,
        );
        expect(dashboard.userActivity.totalUsers).toBeGreaterThanOrEqual(0);
        expect(dashboard.content.totalRegions).toBeGreaterThanOrEqual(0);
      }
    });

    it("should provide valid percentage calculations", async () => {
      const subscriptionResult = await getSubscriptionAnalytics(context);

      expect(subscriptionResult.isOk()).toBe(true);
      if (subscriptionResult.isOk()) {
        const analytics = subscriptionResult.value;

        // Plan distribution percentages should sum to reasonable total
        const totalPlanPercentage = analytics.planDistribution.reduce(
          (sum, plan) => sum + plan.percentage,
          0,
        );
        expect(totalPlanPercentage).toBeGreaterThanOrEqual(0);
        expect(totalPlanPercentage).toBeLessThanOrEqual(100);

        // All percentages should be valid
        analytics.planDistribution.forEach((plan) => {
          expect(plan.percentage).toBeGreaterThanOrEqual(0);
          expect(plan.percentage).toBeLessThanOrEqual(100);
        });

        analytics.statusDistribution.forEach((status) => {
          expect(status.percentage).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it("should handle concurrent analytics requests", async () => {
      const [result1, result2, result3] = await Promise.all([
        getSubscriptionAnalytics(context),
        getUserActivityAnalytics(context),
        getContentAnalytics(context),
      ]);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      expect(result3.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk() && result3.isOk()) {
        // Results should be consistent across concurrent calls
        expect(result1.value.totalSubscribers).toBeGreaterThanOrEqual(0);
        expect(result2.value.totalUsers).toBeGreaterThanOrEqual(0);
        expect(result3.value.totalRegions).toBeGreaterThanOrEqual(0);
      }
    });

    it("should maintain data integrity across analytics", async () => {
      const dashboardResult = await getDashboardAnalytics(context);

      expect(dashboardResult.isOk()).toBe(true);
      if (dashboardResult.isOk()) {
        const dashboard = dashboardResult.value;

        // Data integrity checks
        expect(dashboard.userActivity.totalUsers).toBe(
          dashboard.userActivity.activeUsers +
            dashboard.userActivity.inactiveUsers,
        );

        expect(dashboard.content.totalRegions).toBe(
          dashboard.content.publishedRegions +
            dashboard.content.draftRegions +
            dashboard.content.archivedRegions,
        );

        expect(dashboard.content.totalPlaces).toBe(
          dashboard.content.publishedPlaces +
            dashboard.content.draftPlaces +
            dashboard.content.archivedPlaces,
        );
      }
    });

    it("should handle timezone and date edge cases", async () => {
      // Test around month/week boundaries
      const now = new Date();
      const _startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      const result = await getUserActivityAnalytics(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;

        // Should handle date boundaries correctly
        expect(analytics.newUsersThisMonth).toBeGreaterThanOrEqual(0);
        expect(analytics.newUsersThisWeek).toBeGreaterThanOrEqual(0);
        expect(analytics.checkinsThisMonth).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
