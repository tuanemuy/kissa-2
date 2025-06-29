import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { User, UserSubscription } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import {
  cancelSubscription,
  renewSubscription,
  type UpdateSubscriptionInput,
  updateSubscription,
} from "./updateSubscription";

describe("updateSubscription", () => {
  let context: Context;
  let userWithSubscription: User;
  let userWithoutSubscription: User;
  let testSubscription: UserSubscription;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    // Create user with subscription
    const userWithSubResult = await context.userRepository.create({
      email: "withsub@example.com",
      password: hashedPassword.value,
      name: "User With Subscription",
    });
    if (userWithSubResult.isErr()) {
      throw new Error("Failed to create user with subscription");
    }
    userWithSubscription = userWithSubResult.value;

    // Create user without subscription
    const userWithoutSubResult = await context.userRepository.create({
      email: "withoutsub@example.com",
      password: hashedPassword.value,
      name: "User Without Subscription",
    });
    if (userWithoutSubResult.isErr()) {
      throw new Error("Failed to create user without subscription");
    }
    userWithoutSubscription = userWithoutSubResult.value;

    // Create test subscription
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const subscriptionResult = await context.userSubscriptionRepository.create({
      userId: userWithSubscription.id,
      plan: "standard",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: futureDate,
      cancelAtPeriodEnd: false,
    });
    if (subscriptionResult.isErr()) {
      throw new Error("Failed to create test subscription");
    }
    testSubscription = subscriptionResult.value;
  });

  describe("updateSubscription", () => {
    it("should successfully update subscription plan", async () => {
      const input: UpdateSubscriptionInput = {
        plan: "premium",
      };

      const result = await updateSubscription(
        context,
        userWithSubscription.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedSubscription = result.value;
        expect(updatedSubscription.plan).toBe("premium");
        expect(updatedSubscription.status).toBe("active"); // Should remain unchanged
        expect(updatedSubscription.cancelAtPeriodEnd).toBe(false); // Should remain unchanged
      }
    });

    it("should successfully update subscription status", async () => {
      const input: UpdateSubscriptionInput = {
        status: "cancelled",
      };

      const result = await updateSubscription(
        context,
        userWithSubscription.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedSubscription = result.value;
        expect(updatedSubscription.status).toBe("cancelled");
        expect(updatedSubscription.plan).toBe("standard"); // Should remain unchanged
      }
    });

    it("should successfully update cancelAtPeriodEnd flag", async () => {
      const input: UpdateSubscriptionInput = {
        cancelAtPeriodEnd: true,
      };

      const result = await updateSubscription(
        context,
        userWithSubscription.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedSubscription = result.value;
        expect(updatedSubscription.cancelAtPeriodEnd).toBe(true);
        expect(updatedSubscription.plan).toBe("standard"); // Should remain unchanged
        expect(updatedSubscription.status).toBe("active"); // Should remain unchanged
      }
    });

    it("should successfully extend subscription period", async () => {
      const originalEndDate = testSubscription.currentPeriodEnd;
      const input: UpdateSubscriptionInput = {
        extendDays: 15,
      };

      const result = await updateSubscription(
        context,
        userWithSubscription.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedSubscription = result.value;
        const expectedEndDate = new Date(originalEndDate);
        expectedEndDate.setDate(expectedEndDate.getDate() + 15);

        expect(updatedSubscription.currentPeriodEnd.getTime()).toBeCloseTo(
          expectedEndDate.getTime(),
          -3, // Within a few milliseconds
        );
        expect(updatedSubscription.plan).toBe("standard"); // Should remain unchanged
        expect(updatedSubscription.status).toBe("active"); // Should remain unchanged
      }
    });

    it("should successfully update multiple properties at once", async () => {
      const input: UpdateSubscriptionInput = {
        plan: "premium",
        status: "active",
        cancelAtPeriodEnd: false,
        extendDays: 30,
      };

      const originalEndDate = testSubscription.currentPeriodEnd;
      const result = await updateSubscription(
        context,
        userWithSubscription.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedSubscription = result.value;
        expect(updatedSubscription.plan).toBe("premium");
        expect(updatedSubscription.status).toBe("active");
        expect(updatedSubscription.cancelAtPeriodEnd).toBe(false);

        const expectedEndDate = new Date(originalEndDate);
        expectedEndDate.setDate(expectedEndDate.getDate() + 30);
        expect(updatedSubscription.currentPeriodEnd.getTime()).toBeCloseTo(
          expectedEndDate.getTime(),
          -3,
        );
      }
    });

    it("should handle updates with no changes", async () => {
      const input: UpdateSubscriptionInput = {};

      const result = await updateSubscription(
        context,
        userWithSubscription.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedSubscription = result.value;
        expect(updatedSubscription.plan).toBe("standard");
        expect(updatedSubscription.status).toBe("active");
        expect(updatedSubscription.cancelAtPeriodEnd).toBe(false);
        expect(updatedSubscription.currentPeriodEnd.getTime()).toBe(
          testSubscription.currentPeriodEnd.getTime(),
        );
      }
    });

    it("should handle maximum period extension", async () => {
      const originalEndDate = testSubscription.currentPeriodEnd;
      const input: UpdateSubscriptionInput = {
        extendDays: 365,
      };

      const result = await updateSubscription(
        context,
        userWithSubscription.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedSubscription = result.value;
        const expectedEndDate = new Date(originalEndDate);
        expectedEndDate.setDate(expectedEndDate.getDate() + 365);

        expect(updatedSubscription.currentPeriodEnd.getTime()).toBeCloseTo(
          expectedEndDate.getTime(),
          -3,
        );
      }
    });

    it("should handle minimum period extension", async () => {
      const originalEndDate = testSubscription.currentPeriodEnd;
      const input: UpdateSubscriptionInput = {
        extendDays: 1,
      };

      const result = await updateSubscription(
        context,
        userWithSubscription.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedSubscription = result.value;
        const expectedEndDate = new Date(originalEndDate);
        expectedEndDate.setDate(expectedEndDate.getDate() + 1);

        expect(updatedSubscription.currentPeriodEnd.getTime()).toBeCloseTo(
          expectedEndDate.getTime(),
          -3,
        );
      }
    });

    it("should fail when user has no subscription", async () => {
      const input: UpdateSubscriptionInput = {
        plan: "premium",
      };

      const result = await updateSubscription(
        context,
        userWithoutSubscription.id,
        input,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
        expect(result.error.message).toBe("User subscription not found");
      }
    });

    it("should fail when user does not exist", async () => {
      const input: UpdateSubscriptionInput = {
        plan: "premium",
      };

      const result = await updateSubscription(
        context,
        "non-existent-user-id",
        input,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });

    it("should update all plan types correctly", async () => {
      const plans = ["free", "standard", "premium"] as const;

      for (const plan of plans) {
        const input: UpdateSubscriptionInput = { plan };
        const result = await updateSubscription(
          context,
          userWithSubscription.id,
          input,
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const updatedSubscription = result.value;
          expect(updatedSubscription.plan).toBe(plan);
        }
      }
    });

    it("should update all status types correctly", async () => {
      const statuses = ["trial", "active", "expired", "cancelled"] as const;

      for (const status of statuses) {
        const input: UpdateSubscriptionInput = { status };
        const result = await updateSubscription(
          context,
          userWithSubscription.id,
          input,
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const updatedSubscription = result.value;
          expect(updatedSubscription.status).toBe(status);
        }
      }
    });
  });

  describe("cancelSubscription", () => {
    it("should cancel subscription at period end by default", async () => {
      const result = await cancelSubscription(context, userWithSubscription.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const cancelledSubscription = result.value;
        expect(cancelledSubscription.cancelAtPeriodEnd).toBe(true);
        expect(cancelledSubscription.status).toBe("active"); // Should remain active until period end
        expect(cancelledSubscription.currentPeriodEnd.getTime()).toBe(
          testSubscription.currentPeriodEnd.getTime(),
        ); // End date should not change
      }
    });

    it("should cancel subscription immediately when requested", async () => {
      const beforeCancel = new Date();
      const result = await cancelSubscription(
        context,
        userWithSubscription.id,
        true,
      );
      const afterCancel = new Date();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const cancelledSubscription = result.value;
        expect(cancelledSubscription.status).toBe("cancelled");
        expect(cancelledSubscription.cancelAtPeriodEnd).toBe(false);

        // Period end should be set to now (immediate cancellation)
        expect(
          cancelledSubscription.currentPeriodEnd.getTime(),
        ).toBeGreaterThanOrEqual(beforeCancel.getTime());
        expect(
          cancelledSubscription.currentPeriodEnd.getTime(),
        ).toBeLessThanOrEqual(afterCancel.getTime());
      }
    });

    it("should fail when user has no subscription", async () => {
      const result = await cancelSubscription(
        context,
        userWithoutSubscription.id,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
        expect(result.error.message).toBe("User subscription not found");
      }
    });

    it("should fail when user does not exist", async () => {
      const result = await cancelSubscription(context, "non-existent-user-id");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });

    it("should handle cancelling already cancelled subscription", async () => {
      // First cancellation
      const firstResult = await cancelSubscription(
        context,
        userWithSubscription.id,
      );
      expect(firstResult.isOk()).toBe(true);

      // Second cancellation should still work
      const secondResult = await cancelSubscription(
        context,
        userWithSubscription.id,
      );
      expect(secondResult.isOk()).toBe(true);

      if (secondResult.isOk()) {
        const subscription = secondResult.value;
        expect(subscription.cancelAtPeriodEnd).toBe(true);
      }
    });

    it("should handle immediate cancellation of already cancelled subscription", async () => {
      // First cancellation (at period end)
      await cancelSubscription(context, userWithSubscription.id);

      // Immediate cancellation should override
      const result = await cancelSubscription(
        context,
        userWithSubscription.id,
        true,
      );
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const subscription = result.value;
        expect(subscription.status).toBe("cancelled");
        expect(subscription.cancelAtPeriodEnd).toBe(false);
      }
    });
  });

  describe("renewSubscription", () => {
    it("should renew active subscription with default period", async () => {
      const originalEndDate = testSubscription.currentPeriodEnd;

      const result = await renewSubscription(context, userWithSubscription.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const renewedSubscription = result.value;
        expect(renewedSubscription.status).toBe("active");
        expect(renewedSubscription.cancelAtPeriodEnd).toBe(false);
        expect(renewedSubscription.currentPeriodStart.getTime()).toBe(
          originalEndDate.getTime(),
        );

        const expectedEndDate = new Date(originalEndDate);
        expectedEndDate.setDate(expectedEndDate.getDate() + 30);
        expect(renewedSubscription.currentPeriodEnd.getTime()).toBeCloseTo(
          expectedEndDate.getTime(),
          -3,
        );
      }
    });

    it("should renew subscription with custom period length", async () => {
      const originalEndDate = testSubscription.currentPeriodEnd;

      const result = await renewSubscription(
        context,
        userWithSubscription.id,
        60,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const renewedSubscription = result.value;
        expect(renewedSubscription.status).toBe("active");
        expect(renewedSubscription.cancelAtPeriodEnd).toBe(false);

        const expectedEndDate = new Date(originalEndDate);
        expectedEndDate.setDate(expectedEndDate.getDate() + 60);
        expect(renewedSubscription.currentPeriodEnd.getTime()).toBeCloseTo(
          expectedEndDate.getTime(),
          -3,
        );
      }
    });

    it("should renew expired subscription from current time", async () => {
      // Create expired subscription
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const expiredDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      const expiredUser = await context.userRepository.create({
        email: "expired@example.com",
        password: "hashedPassword123",
        name: "Expired User",
      });
      expect(expiredUser.isOk()).toBe(true);

      if (expiredUser.isOk()) {
        const expiredSubscriptionResult =
          await context.userSubscriptionRepository.create({
            userId: expiredUser.value.id,
            plan: "standard",
            status: "expired",
            currentPeriodStart: pastDate,
            currentPeriodEnd: expiredDate,
            cancelAtPeriodEnd: false,
          });
        expect(expiredSubscriptionResult.isOk()).toBe(true);

        const beforeRenewal = new Date();
        const result = await renewSubscription(
          context,
          expiredUser.value.id,
          30,
        );
        const afterRenewal = new Date();

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const renewedSubscription = result.value;
          expect(renewedSubscription.status).toBe("active");
          expect(renewedSubscription.cancelAtPeriodEnd).toBe(false);

          // Should start from now, not from the expired date
          expect(
            renewedSubscription.currentPeriodStart.getTime(),
          ).toBeGreaterThanOrEqual(beforeRenewal.getTime());
          expect(
            renewedSubscription.currentPeriodStart.getTime(),
          ).toBeLessThanOrEqual(afterRenewal.getTime());

          // Should end 30 days from the new start time
          const expectedEndDate = new Date(
            renewedSubscription.currentPeriodStart,
          );
          expectedEndDate.setDate(expectedEndDate.getDate() + 30);
          expect(renewedSubscription.currentPeriodEnd.getTime()).toBeCloseTo(
            expectedEndDate.getTime(),
            -3,
          );
        }
      }
    });

    it("should renew cancelled subscription", async () => {
      // Cancel subscription first
      await cancelSubscription(context, userWithSubscription.id);

      const result = await renewSubscription(context, userWithSubscription.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const renewedSubscription = result.value;
        expect(renewedSubscription.status).toBe("active");
        expect(renewedSubscription.cancelAtPeriodEnd).toBe(false);
      }
    });

    it("should fail when user has no subscription", async () => {
      const result = await renewSubscription(
        context,
        userWithoutSubscription.id,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
        expect(result.error.message).toBe("User subscription not found");
      }
    });

    it("should fail when user does not exist", async () => {
      const result = await renewSubscription(context, "non-existent-user-id");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });

    it("should handle very short renewal periods", async () => {
      const result = await renewSubscription(
        context,
        userWithSubscription.id,
        1,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const renewedSubscription = result.value;
        const startDate = renewedSubscription.currentPeriodStart;
        const endDate = renewedSubscription.currentPeriodEnd;

        const diffDays =
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        expect(diffDays).toBeCloseTo(1, 2);
      }
    });

    it("should handle very long renewal periods", async () => {
      const result = await renewSubscription(
        context,
        userWithSubscription.id,
        365,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const renewedSubscription = result.value;
        const startDate = renewedSubscription.currentPeriodStart;
        const endDate = renewedSubscription.currentPeriodEnd;

        const diffDays =
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        expect(diffDays).toBeCloseTo(365, 2);
      }
    });
  });

  describe("edge cases and concurrent operations", () => {
    it("should handle concurrent updates to the same subscription", async () => {
      const input1: UpdateSubscriptionInput = { plan: "premium" };
      const input2: UpdateSubscriptionInput = { status: "cancelled" };

      const [result1, result2] = await Promise.all([
        updateSubscription(context, userWithSubscription.id, input1),
        updateSubscription(context, userWithSubscription.id, input2),
      ]);

      // Both should succeed as they update different fields
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
    });

    it("should handle concurrent cancellation and renewal", async () => {
      const [cancelResult, renewResult] = await Promise.all([
        cancelSubscription(context, userWithSubscription.id),
        renewSubscription(context, userWithSubscription.id),
      ]);

      // Both operations should succeed
      expect(cancelResult.isOk()).toBe(true);
      expect(renewResult.isOk()).toBe(true);
    });

    it("should maintain data integrity after multiple operations", async () => {
      // Perform a series of operations
      const updateResult = await updateSubscription(
        context,
        userWithSubscription.id,
        {
          plan: "premium",
          extendDays: 15,
        },
      );
      expect(updateResult.isOk()).toBe(true);

      const cancelResult = await cancelSubscription(
        context,
        userWithSubscription.id,
      );
      expect(cancelResult.isOk()).toBe(true);

      const renewResult = await renewSubscription(
        context,
        userWithSubscription.id,
        60,
      );
      expect(renewResult.isOk()).toBe(true);

      // Final state should be consistent
      if (renewResult.isOk()) {
        const finalSubscription = renewResult.value;
        expect(finalSubscription.status).toBe("active");
        expect(finalSubscription.cancelAtPeriodEnd).toBe(false);
        expect(finalSubscription.plan).toBe("premium"); // Should maintain the plan from earlier update
      }
    });

    it("should handle period extension edge cases with month boundaries", async () => {
      // Test extending subscription that ends on month boundary
      const input: UpdateSubscriptionInput = {
        extendDays: 31, // More than most months
      };

      const originalEndDate = testSubscription.currentPeriodEnd;
      const result = await updateSubscription(
        context,
        userWithSubscription.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedSubscription = result.value;
        const expectedEndDate = new Date(originalEndDate);
        expectedEndDate.setDate(expectedEndDate.getDate() + 31);

        expect(updatedSubscription.currentPeriodEnd.getTime()).toBeCloseTo(
          expectedEndDate.getTime(),
          -3,
        );
      }
    });

    it("should preserve subscription metadata during updates", async () => {
      const input: UpdateSubscriptionInput = {
        plan: "premium",
        status: "active",
        extendDays: 10,
        cancelAtPeriodEnd: true,
      };

      const result = await updateSubscription(
        context,
        userWithSubscription.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedSubscription = result.value;

        // Metadata should be preserved
        expect(updatedSubscription.id).toBe(testSubscription.id);
        expect(updatedSubscription.userId).toBe(testSubscription.userId);
        expect(updatedSubscription.createdAt).toEqual(
          testSubscription.createdAt,
        );
        expect(updatedSubscription.updatedAt).toBeDefined();

        // Only specified fields should be updated
        expect(updatedSubscription.plan).toBe("premium");
        expect(updatedSubscription.status).toBe("active");
        expect(updatedSubscription.cancelAtPeriodEnd).toBe(true);
      }
    });
  });
});
