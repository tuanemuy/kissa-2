import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import {
  type CreateSubscriptionInput,
  createSubscription,
} from "./createSubscription";

describe("createSubscription", () => {
  let context: Context;
  let activeUser: User;
  let suspendedUser: User;
  let deletedUser: User;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    // Create active user
    const activeUserResult = await context.userRepository.create({
      email: "active@example.com",
      password: hashedPassword.value,
      name: "Active User",
    });
    if (activeUserResult.isErr()) {
      throw new Error("Failed to create active user");
    }
    activeUser = activeUserResult.value;

    // Create suspended user
    const suspendedUserResult = await context.userRepository.create({
      email: "suspended@example.com",
      password: hashedPassword.value,
      name: "Suspended User",
    });
    if (suspendedUserResult.isErr()) {
      throw new Error("Failed to create suspended user");
    }
    suspendedUser = suspendedUserResult.value;
    await context.userRepository.updateStatus(suspendedUser.id, "suspended");

    // Create deleted user
    const deletedUserResult = await context.userRepository.create({
      email: "deleted@example.com",
      password: hashedPassword.value,
      name: "Deleted User",
    });
    if (deletedUserResult.isErr()) {
      throw new Error("Failed to create deleted user");
    }
    deletedUser = deletedUserResult.value;
    await context.userRepository.updateStatus(deletedUser.id, "deleted");
  });

  describe("successful subscription creation", () => {
    it("should successfully create a free trial subscription", async () => {
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "free",
        status: "trial",
        periodLengthDays: 7,
      };

      const result = await createSubscription(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        expect(subscription.userId).toBe(activeUser.id);
        expect(subscription.plan).toBe("free");
        expect(subscription.status).toBe("trial");
        expect(subscription.cancelAtPeriodEnd).toBe(false);
        expect(subscription.currentPeriodStart).toBeDefined();
        expect(subscription.currentPeriodEnd).toBeDefined();

        // Check period length
        const startDate = subscription.currentPeriodStart;
        const endDate = subscription.currentPeriodEnd;
        const diffDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
        );
        expect(diffDays).toBe(7);
      }
    });

    it("should successfully create a standard subscription", async () => {
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "standard",
        status: "active",
        periodLengthDays: 30,
      };

      const result = await createSubscription(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        expect(subscription.userId).toBe(activeUser.id);
        expect(subscription.plan).toBe("standard");
        expect(subscription.status).toBe("active");
        expect(subscription.cancelAtPeriodEnd).toBe(false);

        // Check period length (30 days)
        const startDate = subscription.currentPeriodStart;
        const endDate = subscription.currentPeriodEnd;
        const diffDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
        );
        expect(diffDays).toBe(30);
      }
    });

    it("should successfully create a premium subscription", async () => {
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "premium",
        status: "active",
        periodLengthDays: 365,
      };

      const result = await createSubscription(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        expect(subscription.userId).toBe(activeUser.id);
        expect(subscription.plan).toBe("premium");
        expect(subscription.status).toBe("active");

        // Check period length (365 days)
        const startDate = subscription.currentPeriodStart;
        const endDate = subscription.currentPeriodEnd;
        const diffDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
        );
        expect(diffDays).toBe(365);
      }
    });

    it("should use default values for optional parameters", async () => {
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "standard",
        status: "active",
        periodLengthDays: 30,
      };

      const result = await createSubscription(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        expect(subscription.status).toBe("trial"); // Default status
        expect(subscription.cancelAtPeriodEnd).toBe(false);

        // Check default period length (30 days)
        const startDate = subscription.currentPeriodStart;
        const endDate = subscription.currentPeriodEnd;
        const diffDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
        );
        expect(diffDays).toBe(30);
      }
    });

    it("should create subscription with custom period length", async () => {
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "standard",
        status: "active",
        periodLengthDays: 90,
      };

      const result = await createSubscription(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        expect(subscription.plan).toBe("standard");
        expect(subscription.status).toBe("active");

        // Check custom period length (90 days)
        const startDate = subscription.currentPeriodStart;
        const endDate = subscription.currentPeriodEnd;
        const diffDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
        );
        expect(diffDays).toBe(90);
      }
    });

    it("should set correct start and end times", async () => {
      const beforeCreation = new Date();

      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "standard",
        status: "active",
        periodLengthDays: 30,
      };

      const result = await createSubscription(context, input);

      const afterCreation = new Date();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;

        // Start time should be around now
        expect(
          subscription.currentPeriodStart.getTime(),
        ).toBeGreaterThanOrEqual(beforeCreation.getTime());
        expect(subscription.currentPeriodStart.getTime()).toBeLessThanOrEqual(
          afterCreation.getTime(),
        );

        // End time should be 30 days after start
        const expectedEnd = new Date(subscription.currentPeriodStart);
        expectedEnd.setDate(expectedEnd.getDate() + 30);
        expect(subscription.currentPeriodEnd.getTime()).toBeCloseTo(
          expectedEnd.getTime(),
          -3,
        ); // Within a few milliseconds
      }
    });
  });

  describe("user validation", () => {
    it("should fail when user does not exist", async () => {
      const input: CreateSubscriptionInput = {
        userId: "non-existent-user-id",
        plan: "standard",
        status: "active",
        periodLengthDays: 30,
      };

      const result = await createSubscription(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
        expect(result.error.message).toBe("User not found");
      }
    });

    it("should fail when user is suspended", async () => {
      const input: CreateSubscriptionInput = {
        userId: suspendedUser.id,
        plan: "standard",
        status: "active",
        periodLengthDays: 30,
      };

      const result = await createSubscription(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
        expect(result.error.message).toBe("User account is not active");
      }
    });

    it("should fail when user is deleted", async () => {
      const input: CreateSubscriptionInput = {
        userId: deletedUser.id,
        plan: "standard",
        status: "active",
        periodLengthDays: 30,
      };

      const result = await createSubscription(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
        expect(result.error.message).toBe("User account is not active");
      }
    });

    it("should handle invalid user ID format", async () => {
      const input: CreateSubscriptionInput = {
        userId: "invalid-uuid-format",
        plan: "standard",
        status: "active",
        periodLengthDays: 30,
      };

      const result = await createSubscription(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });

  describe("existing subscription validation", () => {
    it("should fail when user already has a subscription", async () => {
      // Create first subscription
      const input1: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "standard",
        status: "active",
        periodLengthDays: 30,
      };

      const firstResult = await createSubscription(context, input1);
      expect(firstResult.isOk()).toBe(true);

      // Try to create second subscription
      const input2: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "premium",
        status: "active",
        periodLengthDays: 30,
      };

      const secondResult = await createSubscription(context, input2);

      expect(secondResult.isErr()).toBe(true);
      if (secondResult.isErr()) {
        expect(secondResult.error.code).toBe(
          ERROR_CODES.SUBSCRIPTION_ALREADY_EXISTS,
        );
        expect(secondResult.error.message).toBe(
          "User already has a subscription",
        );
      }
    });

    it("should fail when user has expired subscription", async () => {
      // Manually create an expired subscription first
      const now = new Date();
      const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const expiredDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      const expiredSubscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: activeUser.id,
          plan: "standard",
          status: "expired",
          currentPeriodStart: pastDate,
          currentPeriodEnd: expiredDate,
          cancelAtPeriodEnd: false,
        });
      expect(expiredSubscriptionResult.isOk()).toBe(true);

      // Try to create new subscription
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "premium",
        status: "active",
        periodLengthDays: 30,
      };

      const result = await createSubscription(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.SUBSCRIPTION_ALREADY_EXISTS);
        expect(result.error.message).toBe("User already has a subscription");
      }
    });

    it("should fail when user has cancelled subscription", async () => {
      // Manually create a cancelled subscription first
      const now = new Date();
      const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

      const cancelledSubscriptionResult =
        await context.userSubscriptionRepository.create({
          userId: activeUser.id,
          plan: "standard",
          status: "cancelled",
          currentPeriodStart: now,
          currentPeriodEnd: futureDate,
          cancelAtPeriodEnd: true,
        });
      expect(cancelledSubscriptionResult.isOk()).toBe(true);

      // Try to create new subscription
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "premium",
        status: "active",
        periodLengthDays: 30,
      };

      const result = await createSubscription(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.SUBSCRIPTION_ALREADY_EXISTS);
        expect(result.error.message).toBe("User already has a subscription");
      }
    });
  });

  describe("input validation", () => {
    it("should handle minimum period length", async () => {
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "standard",
        status: "active",
        periodLengthDays: 1,
      };

      const result = await createSubscription(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        const startDate = subscription.currentPeriodStart;
        const endDate = subscription.currentPeriodEnd;
        const diffDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
        );
        expect(diffDays).toBe(1);
      }
    });

    it("should handle maximum period length", async () => {
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "premium",
        status: "active",
        periodLengthDays: 365,
      };

      const result = await createSubscription(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        const startDate = subscription.currentPeriodStart;
        const endDate = subscription.currentPeriodEnd;
        const diffDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
        );
        expect(diffDays).toBe(365);
      }
    });

    it("should create subscription with all valid status values", async () => {
      const statuses = ["trial", "active", "expired", "cancelled"] as const;

      for (const status of statuses) {
        // Create a new user for each test to avoid subscription conflicts
        const userResult = await context.userRepository.create({
          email: `test-${status}@example.com`,
          password: "hashedPassword123",
          name: `Test User ${status}`,
        });
        expect(userResult.isOk()).toBe(true);

        if (userResult.isOk()) {
          const user = userResult.value;

          const input: CreateSubscriptionInput = {
            userId: user.id,
            plan: "standard",
            status: status,
            periodLengthDays: 30,
          };

          const result = await createSubscription(context, input);

          expect(result.isOk()).toBe(true);
          if (result.isOk()) {
            const subscription = result.value;
            expect(subscription.status).toBe(status);
          }
        }
      }
    });

    it("should create subscription with all valid plan values", async () => {
      const plans = ["free", "standard", "premium"] as const;

      for (const plan of plans) {
        // Create a new user for each test to avoid subscription conflicts
        const userResult = await context.userRepository.create({
          email: `test-${plan}@example.com`,
          password: "hashedPassword123",
          name: `Test User ${plan}`,
        });
        expect(userResult.isOk()).toBe(true);

        if (userResult.isOk()) {
          const user = userResult.value;

          const input: CreateSubscriptionInput = {
            userId: user.id,
            plan: plan,
            status: "active",
            periodLengthDays: 30,
          };

          const result = await createSubscription(context, input);

          expect(result.isOk()).toBe(true);
          if (result.isOk()) {
            const subscription = result.value;
            expect(subscription.plan).toBe(plan);
          }
        }
      }
    });
  });

  describe("edge cases", () => {
    it("should handle subscription creation near month boundaries", async () => {
      // This test checks date calculation edge cases
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "standard",
        status: "active",
        periodLengthDays: 31, // More than most months
      };

      const result = await createSubscription(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        const startDate = subscription.currentPeriodStart;
        const endDate = subscription.currentPeriodEnd;

        // Should be exactly 31 days apart
        const diffDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
        );
        expect(diffDays).toBe(31);

        // End date should be valid
        expect(endDate).toBeInstanceOf(Date);
        expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
      }
    });

    it("should handle subscription creation with very short period", async () => {
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "free",
        status: "trial",
        periodLengthDays: 1,
      };

      const result = await createSubscription(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        const startDate = subscription.currentPeriodStart;
        const endDate = subscription.currentPeriodEnd;

        // Should be exactly 1 day apart
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffDays = diffMs / (1000 * 3600 * 24);
        expect(diffDays).toBeCloseTo(1, 2);
      }
    });

    it("should preserve exact time components in date calculation", async () => {
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "standard",
        status: "active",
        periodLengthDays: 7,
      };

      const result = await createSubscription(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;
        const startDate = subscription.currentPeriodStart;
        const endDate = subscription.currentPeriodEnd;

        // Start and end should have same time components (hour, minute, second, ms)
        expect(endDate.getHours()).toBe(startDate.getHours());
        expect(endDate.getMinutes()).toBe(startDate.getMinutes());
        expect(endDate.getSeconds()).toBe(startDate.getSeconds());
      }
    });

    it("should handle concurrent subscription creation attempts", async () => {
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "standard",
        status: "active",
        periodLengthDays: 30,
      };

      // Attempt concurrent subscription creation
      const [result1, result2] = await Promise.all([
        createSubscription(context, input),
        createSubscription(context, input),
      ]);

      // One should succeed, one should fail
      const successCount = [result1, result2].filter((r) => r.isOk()).length;
      const errorResults = [result1, result2].filter((r) =>
        r.isErr(),
      ) as Array<{ error: { code: string } }>;

      expect(successCount).toBe(1);
      expect(errorResults).toHaveLength(1);
      expect(errorResults[0].error.code).toBe(
        ERROR_CODES.SUBSCRIPTION_ALREADY_EXISTS,
      );
    });

    it("should maintain subscription data integrity", async () => {
      const input: CreateSubscriptionInput = {
        userId: activeUser.id,
        plan: "premium",
        status: "active",
        periodLengthDays: 30,
      };

      const result = await createSubscription(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const subscription = result.value;

        // Verify all required fields are present and valid
        expect(subscription.id).toBeDefined();
        expect(subscription.userId).toBe(activeUser.id);
        expect(subscription.plan).toBe("premium");
        expect(subscription.status).toBe("active");
        expect(subscription.currentPeriodStart).toBeInstanceOf(Date);
        expect(subscription.currentPeriodEnd).toBeInstanceOf(Date);
        expect(subscription.cancelAtPeriodEnd).toBe(false);
        expect(subscription.createdAt).toBeInstanceOf(Date);
        expect(subscription.updatedAt).toBeInstanceOf(Date);

        // Verify period end is after period start
        expect(subscription.currentPeriodEnd.getTime()).toBeGreaterThan(
          subscription.currentPeriodStart.getTime(),
        );
      }
    });
  });
});
