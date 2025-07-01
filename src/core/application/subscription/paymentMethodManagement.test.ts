import { beforeEach, describe, expect, it } from "vitest";
import type { MockPaymentMethodRepository } from "@/core/adapters/mock/paymentRepository";
import { createMockContext } from "@/core/adapters/mock/testContext";
import type { MockUserRepository } from "@/core/adapters/mock/userRepository";
import type { PaymentMethod, User } from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  type AddPaymentMethodInput,
  addPaymentMethod,
  deletePaymentMethod,
  getDefaultPaymentMethod,
  getUserPaymentMethods,
  type UpdatePaymentMethodInput,
  updatePaymentMethod,
} from "./paymentMethodManagement";

describe("Payment Method Management", () => {
  let context: Context;
  let mockUser: User;
  let mockPaymentMethod: PaymentMethod;

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

    // Set up mock repositories with test data
    const userRepo = context.userRepository as MockUserRepository;
    const paymentRepo =
      context.paymentMethodRepository as MockPaymentMethodRepository;

    // Add mock users and payment methods
    userRepo.addUser(mockUser);
    paymentRepo.addPaymentMethod(mockPaymentMethod);
  });

  describe("addPaymentMethod", () => {
    it("should successfully add a credit card payment method", async () => {
      // Arrange
      const input: AddPaymentMethodInput = {
        type: "credit_card",
        isDefault: true,
        cardLast4: "5678",
        cardBrand: "MasterCard",
        expiryMonth: 10,
        expiryYear: 2027,
      };

      // Act
      const result = await addPaymentMethod(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("credit_card");
        expect(result.value.cardLast4).toBe("5678");
        expect(result.value.cardBrand).toBe("MasterCard");
        expect(result.value.expiryMonth).toBe(10);
        expect(result.value.expiryYear).toBe(2027);
        expect(result.value.userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
      }
    });

    it("should successfully add a PayPal payment method", async () => {
      // Arrange
      const input: AddPaymentMethodInput = {
        type: "paypal",
        isDefault: false,
        paypalEmail: "test@paypal.com",
      };

      // Act
      const result = await addPaymentMethod(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("paypal");
        expect(result.value.paypalEmail).toBe("test@paypal.com");
        expect(result.value.userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
      }
    });

    it("should fail when user is not found", async () => {
      // Arrange
      const input: AddPaymentMethodInput = {
        type: "credit_card",
        isDefault: false,
        cardLast4: "1234",
        cardBrand: "Visa",
        expiryMonth: 12,
        expiryYear: 2025,
      };

      // Act
      const result = await addPaymentMethod(
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

      const input: AddPaymentMethodInput = {
        type: "credit_card",
        isDefault: false,
        cardLast4: "1234",
        cardBrand: "Visa",
        expiryMonth: 12,
        expiryYear: 2025,
      };

      // Act
      const result = await addPaymentMethod(
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

    it("should fail when credit card details are missing", async () => {
      // Arrange
      const input: AddPaymentMethodInput = {
        type: "credit_card",
        isDefault: false,
        // Missing required credit card details
      };

      // Act
      const result = await addPaymentMethod(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Credit card details are required");
      }
    });

    it("should fail when PayPal email is missing", async () => {
      // Arrange
      const input: AddPaymentMethodInput = {
        type: "paypal",
        isDefault: false,
        // Missing PayPal email
      };

      // Act
      const result = await addPaymentMethod(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("PayPal email is required");
      }
    });
  });

  describe("getUserPaymentMethods", () => {
    it("should successfully get user payment methods", async () => {
      // Act
      const result = await getUserPaymentMethods(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThanOrEqual(1);
        expect(result.value[0].userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
      }
    });

    it("should fail when user is not found", async () => {
      // Act
      const result = await getUserPaymentMethods(
        context,
        "00000000-0000-0000-0000-000000000000",
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to find user");
      }
    });
  });

  describe("updatePaymentMethod", () => {
    it("should successfully update payment method", async () => {
      // Arrange
      const input: UpdatePaymentMethodInput = {
        paymentMethodId: "payment-123",
        cardLast4: "5678",
      };

      // Act
      const result = await updatePaymentMethod(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.cardLast4).toBe("5678");
      }
    });

    it("should successfully set payment method as default", async () => {
      // Arrange
      const input: UpdatePaymentMethodInput = {
        paymentMethodId: "payment-123",
        isDefault: true,
      };

      // Act
      const result = await updatePaymentMethod(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.isDefault).toBe(true);
      }
    });

    it("should fail when payment method does not belong to user", async () => {
      // Arrange
      const otherUserPaymentMethod = {
        ...mockPaymentMethod,
        id: "other-payment-123",
        userId: "00000000-0000-0000-0000-000000000000",
      };
      const paymentRepo =
        context.paymentMethodRepository as MockPaymentMethodRepository;
      paymentRepo.addPaymentMethod(otherUserPaymentMethod);

      const input: UpdatePaymentMethodInput = {
        paymentMethodId: "other-payment-123",
        cardLast4: "5678",
      };

      // Act
      const result = await updatePaymentMethod(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Payment method does not belong to user",
        );
      }
    });
  });

  describe("deletePaymentMethod", () => {
    it("should successfully delete payment method", async () => {
      // Act
      const result = await deletePaymentMethod(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        "payment-123",
      );

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should fail when payment method is not found", async () => {
      // Act
      const result = await deletePaymentMethod(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        "non-existent-payment-123",
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Payment method not found");
      }
    });
  });

  describe("getDefaultPaymentMethod", () => {
    it("should successfully get default payment method", async () => {
      // Act
      const result = await getDefaultPaymentMethod(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value?.userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
        expect(result.value?.isDefault).toBe(true);
      }
    });

    it("should return null when no default payment method exists", async () => {
      // Arrange - clear existing payment methods
      const paymentRepo =
        context.paymentMethodRepository as MockPaymentMethodRepository;
      paymentRepo.reset();

      // Act
      const result = await getDefaultPaymentMethod(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });
  });
});
