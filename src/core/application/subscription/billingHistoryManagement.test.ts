import { beforeEach, describe, expect, it } from "vitest";
import type {
  MockBillingHistoryRepository,
  MockPaymentMethodRepository,
} from "@/core/adapters/mock/paymentRepository";
import { createMockContext } from "@/core/adapters/mock/testContext";
import type {
  MockUserRepository,
  MockUserSubscriptionRepository,
} from "@/core/adapters/mock/userRepository";
import type {
  BillingHistory,
  PaymentMethod,
  User,
  UserSubscription,
} from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  type CreateBillingRecordInput,
  createBillingRecord,
  type GetBillingHistoryInput,
  getBillingRecord,
  getUserBillingHistory,
  processBillingPayment,
  type UpdateBillingStatusInput,
  updateBillingStatus,
} from "./billingHistoryManagement";

describe("Billing History Management", () => {
  let context: Context;
  let mockUser: User;
  let mockAdmin: User;
  let mockSubscription: UserSubscription;
  let mockPaymentMethod: PaymentMethod;
  let mockBillingHistory: BillingHistory;

  beforeEach(() => {
    context = createMockContext();

    mockUser = {
      id: "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      email: "test@example.com",
      hashedPassword: "hashed-password",
      name: "Test User",
      role: "editor",
      status: "active",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAdmin = {
      id: "851a534d-106c-4888-80f6-b39d493d4008",
      email: "admin@example.com",
      hashedPassword: "hashed-password",
      name: "Admin User",
      role: "admin",
      status: "active",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockSubscription = {
      id: "subscription-123",
      userId: "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      plan: "standard",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPaymentMethod = {
      id: "payment-123",
      userId: "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      type: "credit_card",
      isDefault: true,
      cardLast4: "1234",
      cardBrand: "Visa",
      expiryMonth: 12,
      expiryYear: 2025,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockBillingHistory = {
      id: "billing-123",
      userId: "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      subscriptionId: "subscription-123",
      paymentMethodId: "payment-123",
      amount: 29.99,
      currency: "USD",
      status: "pending",
      billingPeriodStart: new Date(),
      billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Set up mock repositories with test data
    const userRepo = context.userRepository as MockUserRepository;
    const subscriptionRepo =
      context.userSubscriptionRepository as MockUserSubscriptionRepository;
    const paymentRepo =
      context.paymentMethodRepository as MockPaymentMethodRepository;
    const billingRepo =
      context.billingHistoryRepository as MockBillingHistoryRepository;

    // Add mock users and related data
    userRepo.addUser(mockUser);
    userRepo.addUser(mockAdmin);
    subscriptionRepo.addSubscription(mockSubscription);
    paymentRepo.addPaymentMethod(mockPaymentMethod);
    billingRepo.addBillingHistory(mockBillingHistory);
  });

  describe("createBillingRecord", () => {
    it("should successfully create a billing record", async () => {
      // Arrange
      const input: CreateBillingRecordInput = {
        subscriptionId: "subscription-123",
        paymentMethodId: "payment-123",
        amount: 29.99,
        currency: "USD",
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      // Act
      const result = await createBillingRecord(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
        expect(result.value.subscriptionId).toBe("subscription-123");
        expect(result.value.paymentMethodId).toBe("payment-123");
        expect(result.value.amount).toBe(29.99);
        expect(result.value.currency).toBe("USD");
        expect(result.value.status).toBe("pending");
      }
    });

    it("should successfully create a billing record without payment method", async () => {
      // Arrange
      const input: CreateBillingRecordInput = {
        subscriptionId: "subscription-123",
        amount: 29.99,
        currency: "USD",
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      // Act
      const result = await createBillingRecord(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.paymentMethodId).toBeUndefined();
        expect(result.value.userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
        expect(result.value.subscriptionId).toBe("subscription-123");
      }
    });

    it("should fail when user is not found", async () => {
      // Arrange
      const input: CreateBillingRecordInput = {
        subscriptionId: "subscription-123",
        amount: 29.99,
        currency: "USD",
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      // Act - use a non-existent user ID
      const result = await createBillingRecord(
        context,
        "00000000-0000-0000-0000-000000000000",
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to find user");
      }
    });

    it("should fail when user is not active", async () => {
      // Arrange
      const inactiveUser = {
        ...mockUser,
        id: "44dd88ff-ccea-4806-8be7-9a26c0ee3bb8",
        status: "suspended" as const,
      };
      const userRepo = context.userRepository as MockUserRepository;
      userRepo.addUser(inactiveUser);

      const input: CreateBillingRecordInput = {
        subscriptionId: "subscription-123",
        amount: 29.99,
        currency: "USD",
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      // Act
      const result = await createBillingRecord(
        context,
        "44dd88ff-ccea-4806-8be7-9a26c0ee3bb8",
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("User account is not active");
      }
    });

    it("should fail when subscription does not belong to user", async () => {
      // Arrange
      const input: CreateBillingRecordInput = {
        subscriptionId: "other-subscription-id", // Non-existent subscription ID
        amount: 29.99,
        currency: "USD",
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      // Act
      const result = await createBillingRecord(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Subscription not found or does not belong to user",
        );
      }
    });

    it("should fail when payment method does not belong to user", async () => {
      // Arrange
      const otherPaymentMethod = {
        ...mockPaymentMethod,
        id: "other-payment-123",
        userId: "00000000-0000-0000-0000-000000000000", // Different user
      };
      const paymentRepo =
        context.paymentMethodRepository as MockPaymentMethodRepository;
      paymentRepo.addPaymentMethod(otherPaymentMethod);

      const input: CreateBillingRecordInput = {
        subscriptionId: "subscription-123",
        paymentMethodId: "other-payment-123", // Payment method that doesn't belong to user
        amount: 29.99,
        currency: "USD",
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      // Act
      const result = await createBillingRecord(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Payment method not found or does not belong to user",
        );
      }
    });
  });

  describe("getUserBillingHistory", () => {
    it("should successfully get user billing history", async () => {
      // Arrange
      const input: GetBillingHistoryInput = {
        pagination: { page: 1, limit: 20, order: "desc", orderBy: "createdAt" },
      };

      // Act
      const result = await getUserBillingHistory(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeGreaterThanOrEqual(1);
        expect(result.value.count).toBeGreaterThanOrEqual(1);
        // Check that we get the billing history for the correct user
        expect(result.value.items[0].userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
      }
    });

    it("should use default pagination when not provided", async () => {
      // Act
      const result = await getUserBillingHistory(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items).toBeDefined();
        expect(result.value.count).toBeDefined();
      }
    });
  });

  describe("updateBillingStatus", () => {
    it("should successfully update billing status to paid", async () => {
      // Arrange
      const input: UpdateBillingStatusInput = {
        billingId: "billing-123",
        status: "paid",
        invoiceUrl: "https://example.com/invoice.pdf",
      };

      // Act
      const result = await updateBillingStatus(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe("paid");
        expect(result.value.paidAt).toBeInstanceOf(Date);
        expect(result.value.invoiceUrl).toBe("https://example.com/invoice.pdf");
      }
    });

    it("should successfully update billing status to failed", async () => {
      // Arrange
      const input: UpdateBillingStatusInput = {
        billingId: "billing-123",
        status: "failed",
        failureReason: "Card declined",
      };

      // Act
      const result = await updateBillingStatus(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe("failed");
        expect(result.value.failedAt).toBeInstanceOf(Date);
        expect(result.value.failureReason).toBe("Card declined");
      }
    });

    it("should fail when billing record does not belong to user", async () => {
      // Arrange
      const otherBilling = {
        ...mockBillingHistory,
        id: "other-billing-123",
        userId: "00000000-0000-0000-0000-000000000000", // Different user
      };
      const billingRepo =
        context.billingHistoryRepository as MockBillingHistoryRepository;
      billingRepo.addBillingHistory(otherBilling);

      const input: UpdateBillingStatusInput = {
        billingId: "other-billing-123",
        status: "paid",
      };

      // Act
      const result = await updateBillingStatus(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Billing record does not belong to user",
        );
      }
    });
  });

  describe("getBillingRecord", () => {
    it("should successfully get billing record", async () => {
      // Act
      const result = await getBillingRecord(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        "billing-123",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("billing-123");
        expect(result.value.userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
      }
    });

    it("should fail when billing record does not belong to user", async () => {
      // Act - try to access billing record with wrong user ID
      const result = await getBillingRecord(
        context,
        "00000000-0000-0000-0000-000000000000",
        "billing-123",
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to find user");
      }
    });
  });

  describe("processBillingPayment", () => {
    it("should successfully process successful payment as admin", async () => {
      // Act
      const result = await processBillingPayment(
        context,
        "851a534d-106c-4888-80f6-b39d493d4008",
        "billing-123",
        true,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe("paid");
        expect(result.value.paidAt).toBeInstanceOf(Date);
      }
    });

    it("should successfully process failed payment as admin", async () => {
      // Act
      const result = await processBillingPayment(
        context,
        "851a534d-106c-4888-80f6-b39d493d4008",
        "billing-123",
        false,
        "Insufficient funds",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe("failed");
        expect(result.value.failedAt).toBeInstanceOf(Date);
        expect(result.value.failureReason).toBe("Insufficient funds");
      }
    });

    it("should fail when user is not admin", async () => {
      // Act
      const result = await processBillingPayment(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69", // Regular user, not admin
        "billing-123",
        true,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Admin permissions required");
      }
    });

    it("should fail when admin is not found", async () => {
      // Act - use non-existent admin ID
      const result = await processBillingPayment(
        context,
        "00000000-0000-0000-0000-000000000000",
        "billing-123",
        true,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to find admin user");
      }
    });
  });
});
