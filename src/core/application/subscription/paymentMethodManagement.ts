import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type {
  CreatePaymentMethodParams,
  PaymentMethod,
} from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class PaymentMethodManagementError extends AnyError {
  override readonly name = "PaymentMethodManagementError";
}

export const addPaymentMethodInputSchema = z.object({
  type: z.enum(["credit_card", "bank_transfer", "paypal"]),
  isDefault: z.boolean().default(false),
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2024).max(2050).optional(),
  paypalEmail: z.string().email().optional(),
  bankAccountLast4: z.string().length(4).optional(),
});
export type AddPaymentMethodInput = z.infer<typeof addPaymentMethodInputSchema>;

export const updatePaymentMethodInputSchema = z.object({
  paymentMethodId: z.string().uuid(),
  isDefault: z.boolean().optional(),
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2024).max(2050).optional(),
  paypalEmail: z.string().email().optional(),
  bankAccountLast4: z.string().length(4).optional(),
});
export type UpdatePaymentMethodInput = z.infer<
  typeof updatePaymentMethodInputSchema
>;

/**
 * Add a payment method for a user
 */
export async function addPaymentMethod(
  context: Context,
  userId: string,
  input: AddPaymentMethodInput,
): Promise<Result<PaymentMethod, PaymentMethodManagementError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new PaymentMethodManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new PaymentMethodManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new PaymentMethodManagementError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Validate input based on payment method type
    if (input.type === "credit_card") {
      if (
        !input.cardLast4 ||
        !input.cardBrand ||
        !input.expiryMonth ||
        !input.expiryYear
      ) {
        return err(
          new PaymentMethodManagementError(
            "Credit card details are required",
            ERROR_CODES.VALIDATION_ERROR,
          ),
        );
      }
    } else if (input.type === "paypal") {
      if (!input.paypalEmail) {
        return err(
          new PaymentMethodManagementError(
            "PayPal email is required",
            ERROR_CODES.VALIDATION_ERROR,
          ),
        );
      }
    } else if (input.type === "bank_transfer") {
      if (!input.bankAccountLast4) {
        return err(
          new PaymentMethodManagementError(
            "Bank account details are required",
            ERROR_CODES.VALIDATION_ERROR,
          ),
        );
      }
    }

    // If this is set as default, check if user has any existing payment methods
    if (input.isDefault) {
      const existingMethodsResult =
        await context.paymentMethodRepository.findByUserId(userId);
      if (existingMethodsResult.isErr()) {
        return err(
          new PaymentMethodManagementError(
            "Failed to check existing payment methods",
            ERROR_CODES.INTERNAL_ERROR,
            existingMethodsResult.error,
          ),
        );
      }

      // If there are existing methods, we'll need to update their default status
      // This will be handled by the repository layer
    }

    // Create payment method
    const createParams: CreatePaymentMethodParams = {
      userId,
      type: input.type,
      isDefault: input.isDefault,
      cardLast4: input.cardLast4,
      cardBrand: input.cardBrand,
      expiryMonth: input.expiryMonth,
      expiryYear: input.expiryYear,
      paypalEmail: input.paypalEmail,
      bankAccountLast4: input.bankAccountLast4,
    };

    const createResult =
      await context.paymentMethodRepository.create(createParams);
    if (createResult.isErr()) {
      return err(
        new PaymentMethodManagementError(
          "Failed to create payment method",
          ERROR_CODES.INTERNAL_ERROR,
          createResult.error,
        ),
      );
    }

    return ok(createResult.value);
  } catch (error) {
    return err(
      new PaymentMethodManagementError(
        "Unexpected error during payment method creation",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get all payment methods for a user
 */
export async function getUserPaymentMethods(
  context: Context,
  userId: string,
): Promise<Result<PaymentMethod[], PaymentMethodManagementError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new PaymentMethodManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new PaymentMethodManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Get payment methods
    const methodsResult =
      await context.paymentMethodRepository.findByUserId(userId);
    if (methodsResult.isErr()) {
      return err(
        new PaymentMethodManagementError(
          "Failed to get payment methods",
          ERROR_CODES.INTERNAL_ERROR,
          methodsResult.error,
        ),
      );
    }

    return ok(methodsResult.value);
  } catch (error) {
    return err(
      new PaymentMethodManagementError(
        "Unexpected error getting payment methods",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Update a payment method
 */
export async function updatePaymentMethod(
  context: Context,
  userId: string,
  input: UpdatePaymentMethodInput,
): Promise<Result<PaymentMethod, PaymentMethodManagementError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new PaymentMethodManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new PaymentMethodManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Verify payment method exists and belongs to user
    const paymentMethodResult = await context.paymentMethodRepository.findById(
      input.paymentMethodId,
    );
    if (paymentMethodResult.isErr()) {
      return err(
        new PaymentMethodManagementError(
          "Failed to find payment method",
          ERROR_CODES.INTERNAL_ERROR,
          paymentMethodResult.error,
        ),
      );
    }

    const paymentMethod = paymentMethodResult.value;
    if (!paymentMethod) {
      return err(
        new PaymentMethodManagementError(
          "Payment method not found",
          ERROR_CODES.NOT_FOUND,
        ),
      );
    }

    if (paymentMethod.userId !== userId) {
      return err(
        new PaymentMethodManagementError(
          "Payment method does not belong to user",
          ERROR_CODES.FORBIDDEN,
        ),
      );
    }

    // If setting as default, use the specialized method
    if (input.isDefault) {
      const setDefaultResult =
        await context.paymentMethodRepository.setAsDefault(
          input.paymentMethodId,
          userId,
        );
      if (setDefaultResult.isErr()) {
        return err(
          new PaymentMethodManagementError(
            "Failed to set payment method as default",
            ERROR_CODES.INTERNAL_ERROR,
            setDefaultResult.error,
          ),
        );
      }
      return ok(setDefaultResult.value);
    }

    // Update payment method
    const updateParams = {
      cardLast4: input.cardLast4,
      cardBrand: input.cardBrand,
      expiryMonth: input.expiryMonth,
      expiryYear: input.expiryYear,
      paypalEmail: input.paypalEmail,
      bankAccountLast4: input.bankAccountLast4,
    };

    const updateResult = await context.paymentMethodRepository.update(
      input.paymentMethodId,
      updateParams,
    );
    if (updateResult.isErr()) {
      return err(
        new PaymentMethodManagementError(
          "Failed to update payment method",
          ERROR_CODES.INTERNAL_ERROR,
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new PaymentMethodManagementError(
        "Unexpected error during payment method update",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Delete a payment method
 */
export async function deletePaymentMethod(
  context: Context,
  userId: string,
  paymentMethodId: string,
): Promise<Result<void, PaymentMethodManagementError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new PaymentMethodManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new PaymentMethodManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Verify payment method exists and belongs to user
    const paymentMethodResult =
      await context.paymentMethodRepository.findById(paymentMethodId);
    if (paymentMethodResult.isErr()) {
      return err(
        new PaymentMethodManagementError(
          "Failed to find payment method",
          ERROR_CODES.INTERNAL_ERROR,
          paymentMethodResult.error,
        ),
      );
    }

    const paymentMethod = paymentMethodResult.value;
    if (!paymentMethod) {
      return err(
        new PaymentMethodManagementError(
          "Payment method not found",
          ERROR_CODES.NOT_FOUND,
        ),
      );
    }

    if (paymentMethod.userId !== userId) {
      return err(
        new PaymentMethodManagementError(
          "Payment method does not belong to user",
          ERROR_CODES.FORBIDDEN,
        ),
      );
    }

    // Check if there are active subscriptions using this payment method
    // This would require checking billing history or subscriptions
    // For now, we'll allow deletion but this should be enhanced

    // Delete payment method
    const deleteResult =
      await context.paymentMethodRepository.delete(paymentMethodId);
    if (deleteResult.isErr()) {
      return err(
        new PaymentMethodManagementError(
          "Failed to delete payment method",
          ERROR_CODES.INTERNAL_ERROR,
          deleteResult.error,
        ),
      );
    }

    return ok(deleteResult.value);
  } catch (error) {
    return err(
      new PaymentMethodManagementError(
        "Unexpected error during payment method deletion",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get default payment method for a user
 */
export async function getDefaultPaymentMethod(
  context: Context,
  userId: string,
): Promise<Result<PaymentMethod | null, PaymentMethodManagementError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new PaymentMethodManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new PaymentMethodManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Get default payment method
    const methodResult =
      await context.paymentMethodRepository.findDefaultByUserId(userId);
    if (methodResult.isErr()) {
      return err(
        new PaymentMethodManagementError(
          "Failed to get default payment method",
          ERROR_CODES.INTERNAL_ERROR,
          methodResult.error,
        ),
      );
    }

    return ok(methodResult.value);
  } catch (error) {
    return err(
      new PaymentMethodManagementError(
        "Unexpected error getting default payment method",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
