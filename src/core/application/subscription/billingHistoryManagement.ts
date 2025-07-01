import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type {
  BillingHistory,
  BillingStatus,
  CreateBillingHistoryParams,
} from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class BillingHistoryManagementError extends AnyError {
  override readonly name = "BillingHistoryManagementError";
}

export const createBillingRecordInputSchema = z.object({
  subscriptionId: z.string().uuid(),
  paymentMethodId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  billingPeriodStart: z.date(),
  billingPeriodEnd: z.date(),
});
export type CreateBillingRecordInput = z.infer<
  typeof createBillingRecordInputSchema
>;

export const updateBillingStatusInputSchema = z.object({
  billingId: z.string().uuid(),
  status: z.enum(["pending", "paid", "failed", "refunded", "cancelled"]),
  failureReason: z.string().optional(),
  invoiceUrl: z.string().url().optional(),
});
export type UpdateBillingStatusInput = z.infer<
  typeof updateBillingStatusInputSchema
>;

export const getBillingHistoryInputSchema = z.object({
  pagination: z
    .object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      order: z.enum(["asc", "desc"]).default("desc"),
      orderBy: z.enum(["createdAt", "paidAt"]).default("createdAt"),
    })
    .default({ page: 1, limit: 20, order: "desc", orderBy: "createdAt" }),
});
export type GetBillingHistoryInput = z.infer<
  typeof getBillingHistoryInputSchema
>;

/**
 * Create a new billing record
 */
export async function createBillingRecord(
  context: Context,
  userId: string,
  input: CreateBillingRecordInput,
): Promise<Result<BillingHistory, BillingHistoryManagementError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new BillingHistoryManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new BillingHistoryManagementError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Verify subscription exists and belongs to user
    const subscriptionResult =
      await context.userSubscriptionRepository.findByUserId(userId);
    if (subscriptionResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to find subscription",
          ERROR_CODES.INTERNAL_ERROR,
          subscriptionResult.error,
        ),
      );
    }

    const subscription = subscriptionResult.value;
    if (!subscription || subscription.id !== input.subscriptionId) {
      return err(
        new BillingHistoryManagementError(
          "Subscription not found or does not belong to user",
          ERROR_CODES.SUBSCRIPTION_NOT_FOUND,
        ),
      );
    }

    // If payment method is specified, verify it belongs to user
    if (input.paymentMethodId) {
      const paymentMethodResult =
        await context.paymentMethodRepository.findById(input.paymentMethodId);
      if (paymentMethodResult.isErr()) {
        return err(
          new BillingHistoryManagementError(
            "Failed to find payment method",
            ERROR_CODES.INTERNAL_ERROR,
            paymentMethodResult.error,
          ),
        );
      }

      const paymentMethod = paymentMethodResult.value;
      if (!paymentMethod || paymentMethod.userId !== userId) {
        return err(
          new BillingHistoryManagementError(
            "Payment method not found or does not belong to user",
            ERROR_CODES.NOT_FOUND,
          ),
        );
      }
    }

    // Create billing record
    const createParams: CreateBillingHistoryParams = {
      userId,
      subscriptionId: input.subscriptionId,
      paymentMethodId: input.paymentMethodId,
      amount: input.amount,
      currency: input.currency,
      status: "pending",
      billingPeriodStart: input.billingPeriodStart,
      billingPeriodEnd: input.billingPeriodEnd,
    };

    const createResult =
      await context.billingHistoryRepository.create(createParams);
    if (createResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to create billing record",
          ERROR_CODES.INTERNAL_ERROR,
          createResult.error,
        ),
      );
    }

    return ok(createResult.value);
  } catch (error) {
    return err(
      new BillingHistoryManagementError(
        "Unexpected error during billing record creation",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get billing history for a user
 */
export async function getUserBillingHistory(
  context: Context,
  userId: string,
  input: GetBillingHistoryInput = {
    pagination: { page: 1, limit: 20, order: "desc", orderBy: "createdAt" },
  },
): Promise<
  Result<
    { items: BillingHistory[]; count: number },
    BillingHistoryManagementError
  >
> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new BillingHistoryManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Get billing history
    const billingResult = await context.billingHistoryRepository.findByUserId(
      userId,
      input.pagination,
    );
    if (billingResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to get billing history",
          ERROR_CODES.INTERNAL_ERROR,
          billingResult.error,
        ),
      );
    }

    return ok(billingResult.value);
  } catch (error) {
    return err(
      new BillingHistoryManagementError(
        "Unexpected error getting billing history",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Update billing record status
 */
export async function updateBillingStatus(
  context: Context,
  userId: string,
  input: UpdateBillingStatusInput,
): Promise<Result<BillingHistory, BillingHistoryManagementError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new BillingHistoryManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Verify billing record exists and belongs to user
    const billingResult = await context.billingHistoryRepository.findById(
      input.billingId,
    );
    if (billingResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to find billing record",
          ERROR_CODES.INTERNAL_ERROR,
          billingResult.error,
        ),
      );
    }

    const billing = billingResult.value;
    if (!billing) {
      return err(
        new BillingHistoryManagementError(
          "Billing record not found",
          ERROR_CODES.NOT_FOUND,
        ),
      );
    }

    if (billing.userId !== userId) {
      return err(
        new BillingHistoryManagementError(
          "Billing record does not belong to user",
          ERROR_CODES.FORBIDDEN,
        ),
      );
    }

    // Prepare metadata based on status
    const now = new Date();
    const metadata: {
      paidAt?: Date;
      failedAt?: Date;
      refundedAt?: Date;
      failureReason?: string;
      invoiceUrl?: string;
    } = {};

    if (input.status === "paid") {
      metadata.paidAt = now;
      metadata.invoiceUrl = input.invoiceUrl;
    } else if (input.status === "failed") {
      metadata.failedAt = now;
      metadata.failureReason = input.failureReason;
    } else if (input.status === "refunded") {
      metadata.refundedAt = now;
    }

    if (input.invoiceUrl) {
      metadata.invoiceUrl = input.invoiceUrl;
    }

    // Update billing status
    const updateResult = await context.billingHistoryRepository.updateStatus(
      input.billingId,
      input.status,
      metadata,
    );
    if (updateResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to update billing status",
          ERROR_CODES.INTERNAL_ERROR,
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new BillingHistoryManagementError(
        "Unexpected error during billing status update",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get billing record by ID
 */
export async function getBillingRecord(
  context: Context,
  userId: string,
  billingId: string,
): Promise<Result<BillingHistory, BillingHistoryManagementError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new BillingHistoryManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Get billing record
    const billingResult =
      await context.billingHistoryRepository.findById(billingId);
    if (billingResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to find billing record",
          ERROR_CODES.INTERNAL_ERROR,
          billingResult.error,
        ),
      );
    }

    const billing = billingResult.value;
    if (!billing) {
      return err(
        new BillingHistoryManagementError(
          "Billing record not found",
          ERROR_CODES.NOT_FOUND,
        ),
      );
    }

    if (billing.userId !== userId) {
      return err(
        new BillingHistoryManagementError(
          "Billing record does not belong to user",
          ERROR_CODES.FORBIDDEN,
        ),
      );
    }

    return ok(billing);
  } catch (error) {
    return err(
      new BillingHistoryManagementError(
        "Unexpected error getting billing record",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Process payment for a billing record (admin function)
 */
export async function processBillingPayment(
  context: Context,
  adminUserId: string,
  billingId: string,
  success: boolean,
  failureReason?: string,
): Promise<Result<BillingHistory, BillingHistoryManagementError>> {
  try {
    // Verify admin permissions
    const adminResult = await context.userRepository.findById(adminUserId);
    if (adminResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to find admin user",
          ERROR_CODES.USER_NOT_FOUND,
          adminResult.error,
        ),
      );
    }

    const admin = adminResult.value;
    if (!admin || admin.role !== "admin") {
      return err(
        new BillingHistoryManagementError(
          "Admin permissions required",
          ERROR_CODES.ADMIN_PERMISSION_REQUIRED,
        ),
      );
    }

    // Get billing record
    const billingResult =
      await context.billingHistoryRepository.findById(billingId);
    if (billingResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to find billing record",
          ERROR_CODES.INTERNAL_ERROR,
          billingResult.error,
        ),
      );
    }

    const billing = billingResult.value;
    if (!billing) {
      return err(
        new BillingHistoryManagementError(
          "Billing record not found",
          ERROR_CODES.NOT_FOUND,
        ),
      );
    }

    // Update status based on payment result
    const now = new Date();
    const status: BillingStatus = success ? "paid" : "failed";
    const metadata: {
      paidAt?: Date;
      failedAt?: Date;
      failureReason?: string;
    } = {};

    if (success) {
      metadata.paidAt = now;
    } else {
      metadata.failedAt = now;
      metadata.failureReason = failureReason;
    }

    const updateResult = await context.billingHistoryRepository.updateStatus(
      billingId,
      status,
      metadata,
    );
    if (updateResult.isErr()) {
      return err(
        new BillingHistoryManagementError(
          "Failed to process payment",
          ERROR_CODES.INTERNAL_ERROR,
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new BillingHistoryManagementError(
        "Unexpected error processing payment",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
