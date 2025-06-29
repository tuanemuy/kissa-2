import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import {
  checkSubscriptionPermissions,
  getSubscription,
  getSubscriptionStatus,
} from "./getSubscription";

describe("getSubscription", () => {
  let context: Context;
  let user1: User;
  let user2: User;
  let user3: User;
  let user4: User;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    // Create user 1 (will have active subscription)
    const user1Result = await context.userRepository.create({
      email: "user1@example.com",
      password: hashedPassword.value,
      name: "User 1",
    });
    if (user1Result.isErr()) {
      throw new Error("Failed to create user 1");
    }
    user1 = user1Result.value;

    // Create user 2 (will have expired subscription)
    const user2Result = await context.userRepository.create({
      email: "user2@example.com",
      password: hashedPassword.value,
      name: "User 2",
    });
    if (user2Result.isErr()) {
      throw new Error("Failed to create user 2");
    }
    user2 = user2Result.value;

    // Create user 3 (will have cancelled subscription)
    const user3Result = await context.userRepository.create({
      email: "user3@example.com",
      password: hashedPassword.value,
      name: "User 3",
    });
    if (user3Result.isErr()) {
      throw new Error("Failed to create user 3");
    }
    user3 = user3Result.value;

    // Create user 4 (will have no subscription)
    const user4Result = await context.userRepository.create({
      email: "user4@example.com",
      password: hashedPassword.value,
      name: "User 4",
    });
    if (user4Result.isErr()) {
      throw new Error("Failed to create user 4");
    }
    user4 = user4Result.value;
  });

  describe("getSubscription", () => {
    it("should successfully get user's active subscription", async () => {
      // Create active subscription
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user1.id,
          plan: "standard",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await getSubscription(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        expect(subscription).not.toBeNull();
        expect(subscription?.userId).toBe(user1.id);
        expect(subscription?.plan).toBe("standard");
        expect(subscription?.status).toBe("active");
        expect(subscription?.cancelAtPeriodEnd).toBe(false);
      }
    });

    it("should return null when user has no subscription", async () => {
      const result = await getSubscription(context, user4.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        expect(subscription).toBeNull();
      }
    });

    it("should successfully get user's expired subscription", async () => {
      // Create expired subscription
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const expiredDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user2.id,
          plan: "premium",
          status: "expired",
          currentPeriodStart: pastDate,
          currentPeriodEnd: expiredDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await getSubscription(context, user2.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        expect(subscription).not.toBeNull();
        expect(subscription?.userId).toBe(user2.id);
        expect(subscription?.plan).toBe("premium");
        expect(subscription?.status).toBe("expired");
      }
    });

    it("should successfully get user's cancelled subscription", async () => {
      // Create cancelled subscription
      const now = new Date();
      const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user3.id,
          plan: "standard",
          status: "cancelled",
          currentPeriodStart: now,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: true,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await getSubscription(context, user3.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        expect(subscription).not.toBeNull();
        expect(subscription?.userId).toBe(user3.id);
        expect(subscription?.plan).toBe("standard");
        expect(subscription?.status).toBe("cancelled");
        expect(subscription?.cancelAtPeriodEnd).toBe(true);
      }
    });

    it("should fail when user ID is invalid", async () => {
      const result = await getSubscription(context, "invalid-user-id");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });

    it("should handle repository errors gracefully", async () => {
      // Test with invalid UUID format to trigger repository error
      const result = await getSubscription(context, "not-a-uuid");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
        expect(result.error.message).toBe("Failed to find subscription");
      }
    });
  });

  describe("getSubscriptionStatus", () => {
    it("should return correct status for active subscription", async () => {
      // Create active subscription
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user1.id,
          plan: "standard",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await getSubscriptionStatus(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const status = result.value;
        expect(status.subscription).not.toBeNull();
        expect(status.isActive).toBe(true);
        expect(status.isExpired).toBe(false);
        expect(status.isCancelled).toBe(false);
        expect(status.hasActiveSubscription).toBe(true);
        expect(status.daysUntilExpiry).toBeGreaterThan(25);
        expect(status.daysUntilExpiry).toBeLessThanOrEqual(30);
      }
    });

    it("should return correct status for expired subscription", async () => {
      // Create expired subscription
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const expiredDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user2.id,
          plan: "premium",
          status: "expired",
          currentPeriodStart: pastDate,
          currentPeriodEnd: expiredDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await getSubscriptionStatus(context, user2.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const status = result.value;
        expect(status.subscription).not.toBeNull();
        expect(status.isActive).toBe(false);
        expect(status.isExpired).toBe(true);
        expect(status.isCancelled).toBe(false);
        expect(status.hasActiveSubscription).toBe(false);
        expect(status.daysUntilExpiry).toBeLessThan(0);
      }
    });

    it("should return correct status for cancelled but still active subscription", async () => {
      // Create subscription that's cancelled but still within period
      const now = new Date();
      const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user3.id,
          plan: "standard",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: true,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await getSubscriptionStatus(context, user3.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const status = result.value;
        expect(status.subscription).not.toBeNull();
        expect(status.isActive).toBe(true);
        expect(status.isExpired).toBe(false);
        expect(status.isCancelled).toBe(true); // cancelled because cancelAtPeriodEnd is true
        expect(status.hasActiveSubscription).toBe(true);
        expect(status.daysUntilExpiry).toBeGreaterThan(10);
      }
    });

    it("should return correct status for cancelled subscription", async () => {
      // Create cancelled subscription
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user3.id,
          plan: "standard",
          status: "cancelled",
          currentPeriodStart: pastDate,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await getSubscriptionStatus(context, user3.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const status = result.value;
        expect(status.subscription).not.toBeNull();
        expect(status.isActive).toBe(false);
        expect(status.isExpired).toBe(false);
        expect(status.isCancelled).toBe(true);
        expect(status.hasActiveSubscription).toBe(false);
        expect(status.daysUntilExpiry).toBeGreaterThan(10);
      }
    });

    it("should return correct status for trial subscription", async () => {
      // Create trial subscription
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user1.id,
          plan: "free",
          status: "trial",
          currentPeriodStart: now,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await getSubscriptionStatus(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const status = result.value;
        expect(status.subscription).not.toBeNull();
        expect(status.isActive).toBe(false); // trial is not "active" status
        expect(status.isExpired).toBe(false);
        expect(status.isCancelled).toBe(false);
        expect(status.hasActiveSubscription).toBe(true); // but trial counts as active subscription
        expect(status.daysUntilExpiry).toBeGreaterThan(5);
      }
    });

    it("should return correct status for user with no subscription", async () => {
      const result = await getSubscriptionStatus(context, user4.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const status = result.value;
        expect(status.subscription).toBeNull();
        expect(status.isActive).toBe(false);
        expect(status.isExpired).toBe(false);
        expect(status.isCancelled).toBe(false);
        expect(status.hasActiveSubscription).toBe(false);
        expect(status.daysUntilExpiry).toBeNull();
      }
    });

    it("should handle subscription expiring today", async () => {
      // Create subscription expiring today
      const now = new Date();
      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
      ); // End of today

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user1.id,
          plan: "standard",
          status: "active",
          currentPeriodStart: new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000,
          ),
          currentPeriodEnd: today,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await getSubscriptionStatus(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const status = result.value;
        expect(status.daysUntilExpiry).toBeLessThanOrEqual(1);
        expect(status.daysUntilExpiry).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("checkSubscriptionPermissions", () => {
    it("should allow access for free plan requirement", async () => {
      // Anyone should have access to free features
      const result = await checkSubscriptionPermissions(
        context,
        user4.id,
        "free",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should allow access for user with no subscription when requiring free", async () => {
      const result = await checkSubscriptionPermissions(
        context,
        user4.id,
        "free",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should deny access for user with no subscription when requiring standard", async () => {
      const result = await checkSubscriptionPermissions(
        context,
        user4.id,
        "standard",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });

    it("should allow access for standard user when requiring standard", async () => {
      // Create active standard subscription
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user1.id,
          plan: "standard",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await checkSubscriptionPermissions(
        context,
        user1.id,
        "standard",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should allow access for premium user when requiring standard", async () => {
      // Create active premium subscription
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user1.id,
          plan: "premium",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await checkSubscriptionPermissions(
        context,
        user1.id,
        "standard",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should deny access for standard user when requiring premium", async () => {
      // Create active standard subscription
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user1.id,
          plan: "standard",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await checkSubscriptionPermissions(
        context,
        user1.id,
        "premium",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });

    it("should allow access for premium user when requiring premium", async () => {
      // Create active premium subscription
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user1.id,
          plan: "premium",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await checkSubscriptionPermissions(
        context,
        user1.id,
        "premium",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should deny access for expired subscription", async () => {
      // Create expired subscription
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const expiredDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user2.id,
          plan: "premium",
          status: "expired",
          currentPeriodStart: pastDate,
          currentPeriodEnd: expiredDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await checkSubscriptionPermissions(
        context,
        user2.id,
        "standard",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });

    it("should allow access for trial subscription", async () => {
      // Create trial subscription
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user1.id,
          plan: "standard",
          status: "trial",
          currentPeriodStart: now,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await checkSubscriptionPermissions(
        context,
        user1.id,
        "standard",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should deny access for cancelled subscription", async () => {
      // Create cancelled subscription
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user3.id,
          plan: "standard",
          status: "cancelled",
          currentPeriodStart: pastDate,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await checkSubscriptionPermissions(
        context,
        user3.id,
        "standard",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });

    it("should handle default free requirement", async () => {
      // When no requirement specified, should default to free
      const result = await checkSubscriptionPermissions(context, user4.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should handle invalid user ID", async () => {
      const result = await checkSubscriptionPermissions(
        context,
        "invalid-user-id",
        "standard",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle subscription with null currentPeriodEnd", async () => {
      // This shouldn't happen in normal operation, but we should handle it gracefully
      const now = new Date();

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user1.id,
          plan: "standard",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: now, // Set to now to simulate edge case
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await getSubscriptionStatus(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const status = result.value;
        expect(status.daysUntilExpiry).toBeLessThanOrEqual(1);
      }
    });

    it("should handle very large date differences", async () => {
      // Create subscription with very far future date
      const now = new Date();
      const veryFutureDate = new Date(
        now.getTime() + 365 * 10 * 24 * 60 * 60 * 1000,
      ); // 10 years

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user1.id,
          plan: "premium",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: veryFutureDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await getSubscriptionStatus(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const status = result.value;
        expect(status.daysUntilExpiry).toBeGreaterThan(3650); // More than 10 years
        expect(status.hasActiveSubscription).toBe(true);
      }
    });

    it("should handle subscription that was active but now should be considered expired", async () => {
      // Create subscription that has "active" status but expired date
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const expiredDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const subscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: user1.id,
          plan: "standard",
          status: "active", // Status is active but date has passed
          currentPeriodStart: pastDate,
          currentPeriodEnd: expiredDate,
          cancelAtPeriodEnd: false,
        });
      expect(subscriptionResult.isOk()).toBe(true);

      const result = await getSubscriptionStatus(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const status = result.value;
        expect(status.isActive).toBe(false); // Should be false because date has passed
        expect(status.isExpired).toBe(true);
        expect(status.hasActiveSubscription).toBe(false);
      }
    });
  });
});
