import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import {
  type BillingHistoryRepository,
  type PaymentMethodRepository,
  type UsageMetricsRepository,
  UserRepositoryError,
} from "@/core/domain/user/ports/userRepository";
import type {
  BillingHistory,
  CreateBillingHistoryParams,
  CreatePaymentMethodParams,
  PaymentMethod,
  SubscriptionPlan,
  UsageMetrics,
  UsageMetricsSummary,
} from "@/core/domain/user/types";

export class MockPaymentMethodRepository implements PaymentMethodRepository {
  private paymentMethods = new Map<string, PaymentMethod>();

  async create(
    params: CreatePaymentMethodParams,
  ): Promise<Result<PaymentMethod, UserRepositoryError>> {
    const paymentMethod: PaymentMethod = {
      id: uuidv7(),
      ...params,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.paymentMethods.set(paymentMethod.id, paymentMethod);
    return ok(paymentMethod);
  }

  async findByUserId(
    userId: string,
  ): Promise<Result<PaymentMethod[], UserRepositoryError>> {
    const methods = Array.from(this.paymentMethods.values()).filter(
      (method) => method.userId === userId,
    );
    return ok(methods);
  }

  async findById(
    id: string,
  ): Promise<Result<PaymentMethod | null, UserRepositoryError>> {
    return ok(this.paymentMethods.get(id) || null);
  }

  async update(
    id: string,
    params: Partial<
      Pick<
        PaymentMethod,
        | "isDefault"
        | "cardLast4"
        | "cardBrand"
        | "expiryMonth"
        | "expiryYear"
        | "paypalEmail"
        | "bankAccountLast4"
      >
    >,
  ): Promise<Result<PaymentMethod, UserRepositoryError>> {
    const method = this.paymentMethods.get(id);
    if (!method) {
      return err(
        new UserRepositoryError("Payment method not found", "NOT_FOUND"),
      );
    }
    const updated = { ...method, ...params, updatedAt: new Date() };
    this.paymentMethods.set(id, updated);
    return ok(updated);
  }

  async setAsDefault(
    id: string,
    userId: string,
  ): Promise<Result<PaymentMethod, UserRepositoryError>> {
    // First unset all other methods as default
    for (const [, method] of this.paymentMethods) {
      if (method.userId === userId && method.id !== id) {
        method.isDefault = false;
      }
    }

    const method = this.paymentMethods.get(id);
    if (!method) {
      return err(
        new UserRepositoryError("Payment method not found", "NOT_FOUND"),
      );
    }

    const updated = { ...method, isDefault: true, updatedAt: new Date() };
    this.paymentMethods.set(id, updated);
    return ok(updated);
  }

  async delete(id: string): Promise<Result<void, UserRepositoryError>> {
    this.paymentMethods.delete(id);
    return ok(undefined);
  }

  async findDefaultByUserId(
    userId: string,
  ): Promise<Result<PaymentMethod | null, UserRepositoryError>> {
    const defaultMethod = Array.from(this.paymentMethods.values()).find(
      (method) => method.userId === userId && method.isDefault,
    );
    return ok(defaultMethod || null);
  }

  // Test helper methods
  addPaymentMethod(paymentMethod: PaymentMethod): void {
    this.paymentMethods.set(paymentMethod.id, paymentMethod);
  }

  reset(): void {
    this.paymentMethods.clear();
  }
}

export class MockBillingHistoryRepository implements BillingHistoryRepository {
  private billingHistory = new Map<string, BillingHistory>();

  async create(
    params: CreateBillingHistoryParams,
  ): Promise<Result<BillingHistory, UserRepositoryError>> {
    const billing: BillingHistory = {
      id: uuidv7(),
      ...params,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.billingHistory.set(billing.id, billing);
    return ok(billing);
  }

  async findByUserId(
    userId: string,
    _pagination: {
      page: number;
      limit: number;
      order: "asc" | "desc";
      orderBy: "createdAt" | "paidAt";
    },
  ): Promise<
    Result<{ items: BillingHistory[]; count: number }, UserRepositoryError>
  > {
    const items = Array.from(this.billingHistory.values()).filter(
      (billing) => billing.userId === userId,
    );
    return ok({ items, count: items.length });
  }

  async findById(
    id: string,
  ): Promise<Result<BillingHistory | null, UserRepositoryError>> {
    return ok(this.billingHistory.get(id) || null);
  }

  async updateStatus(
    id: string,
    status: BillingHistory["status"],
    metadata?: {
      paidAt?: Date;
      failedAt?: Date;
      refundedAt?: Date;
      failureReason?: string;
      invoiceUrl?: string;
    },
  ): Promise<Result<BillingHistory, UserRepositoryError>> {
    const billing = this.billingHistory.get(id);
    if (!billing) {
      return err(
        new UserRepositoryError("Billing record not found", "NOT_FOUND"),
      );
    }
    const updated = { ...billing, status, ...metadata, updatedAt: new Date() };
    this.billingHistory.set(id, updated);
    return ok(updated);
  }

  async findBySubscriptionId(
    subscriptionId: string,
  ): Promise<Result<BillingHistory[], UserRepositoryError>> {
    const items = Array.from(this.billingHistory.values()).filter(
      (billing) => billing.subscriptionId === subscriptionId,
    );
    return ok(items);
  }

  async getTotalRevenue(): Promise<Result<number, UserRepositoryError>> {
    const total = Array.from(this.billingHistory.values())
      .filter((billing) => billing.status === "paid")
      .reduce((sum, billing) => sum + billing.amount, 0);
    return ok(total);
  }

  async getRevenueByPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<Result<number, UserRepositoryError>> {
    const total = Array.from(this.billingHistory.values())
      .filter(
        (billing) =>
          billing.status === "paid" &&
          billing.paidAt &&
          billing.paidAt >= startDate &&
          billing.paidAt <= endDate,
      )
      .reduce((sum, billing) => sum + billing.amount, 0);
    return ok(total);
  }

  // Test helper methods
  addBillingHistory(billing: BillingHistory): void {
    this.billingHistory.set(billing.id, billing);
  }

  reset(): void {
    this.billingHistory.clear();
  }
}

export class MockUsageMetricsRepository implements UsageMetricsRepository {
  private usageMetrics = new Map<string, UsageMetrics>();

  async create(
    metrics: Omit<UsageMetrics, "id" | "createdAt" | "updatedAt">,
  ): Promise<Result<UsageMetrics, UserRepositoryError>> {
    const usage: UsageMetrics = {
      id: uuidv7(),
      ...metrics,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.usageMetrics.set(usage.id, usage);
    return ok(usage);
  }

  async findByUserAndMonth(
    userId: string,
    month: number,
    year: number,
  ): Promise<Result<UsageMetrics | null, UserRepositoryError>> {
    const usage = Array.from(this.usageMetrics.values()).find(
      (metrics) =>
        metrics.userId === userId &&
        metrics.month === month &&
        metrics.year === year,
    );
    return ok(usage || null);
  }

  async findByUserId(
    userId: string,
    limit?: number,
  ): Promise<Result<UsageMetrics[], UserRepositoryError>> {
    const items = Array.from(this.usageMetrics.values())
      .filter((metrics) => metrics.userId === userId)
      .slice(0, limit);
    return ok(items);
  }

  async update(
    id: string,
    params: Partial<
      Pick<
        UsageMetrics,
        | "regionsCreated"
        | "placesCreated"
        | "checkinsCount"
        | "imagesUploaded"
        | "storageUsedMB"
        | "apiCallsCount"
      >
    >,
  ): Promise<Result<UsageMetrics, UserRepositoryError>> {
    const metrics = this.usageMetrics.get(id);
    if (!metrics) {
      return err(
        new UserRepositoryError("Usage metrics not found", "NOT_FOUND"),
      );
    }
    const updated = { ...metrics, ...params, updatedAt: new Date() };
    this.usageMetrics.set(id, updated);
    return ok(updated);
  }

  async incrementUsage(
    userId: string,
    month: number,
    year: number,
    usage: {
      regionsCreated?: number;
      placesCreated?: number;
      checkinsCount?: number;
      imagesUploaded?: number;
      storageUsedMB?: number;
      apiCallsCount?: number;
    },
  ): Promise<Result<UsageMetrics, UserRepositoryError>> {
    const existing = await this.findByUserAndMonth(userId, month, year);
    if (existing.isErr()) return err(existing.error);

    if (existing.value) {
      // Update existing
      const updated = {
        ...existing.value,
        regionsCreated:
          existing.value.regionsCreated + (usage.regionsCreated || 0),
        placesCreated:
          existing.value.placesCreated + (usage.placesCreated || 0),
        checkinsCount:
          existing.value.checkinsCount + (usage.checkinsCount || 0),
        imagesUploaded:
          existing.value.imagesUploaded + (usage.imagesUploaded || 0),
        storageUsedMB:
          existing.value.storageUsedMB + (usage.storageUsedMB || 0),
        apiCallsCount:
          existing.value.apiCallsCount + (usage.apiCallsCount || 0),
        updatedAt: new Date(),
      };
      this.usageMetrics.set(existing.value.id, updated);
      return ok(updated);
    }
    // Create new
    return this.create({
      userId,
      month,
      year,
      regionsCreated: usage.regionsCreated || 0,
      placesCreated: usage.placesCreated || 0,
      checkinsCount: usage.checkinsCount || 0,
      imagesUploaded: usage.imagesUploaded || 0,
      storageUsedMB: usage.storageUsedMB || 0,
      apiCallsCount: usage.apiCallsCount || 0,
    });
  }

  async getMonthlyUsage(
    userId: string,
    month: number,
    year: number,
  ): Promise<Result<UsageMetricsSummary, UserRepositoryError>> {
    const usage = await this.findByUserAndMonth(userId, month, year);
    if (usage.isErr()) return err(usage.error);

    if (usage.value) {
      return ok({
        month: usage.value.month,
        year: usage.value.year,
        regionsCreated: usage.value.regionsCreated,
        placesCreated: usage.value.placesCreated,
        checkinsCount: usage.value.checkinsCount,
        imagesUploaded: usage.value.imagesUploaded,
        storageUsedMB: usage.value.storageUsedMB,
        apiCallsCount: usage.value.apiCallsCount,
      });
    }
    return ok({
      month,
      year,
      regionsCreated: 0,
      placesCreated: 0,
      checkinsCount: 0,
      imagesUploaded: 0,
      storageUsedMB: 0,
      apiCallsCount: 0,
    });
  }

  async getYearlyUsage(
    userId: string,
    year: number,
  ): Promise<Result<UsageMetricsSummary[], UserRepositoryError>> {
    const yearlyMetrics = Array.from(this.usageMetrics.values())
      .filter((metrics) => metrics.userId === userId && metrics.year === year)
      .map((metrics) => ({
        month: metrics.month,
        year: metrics.year,
        regionsCreated: metrics.regionsCreated,
        placesCreated: metrics.placesCreated,
        checkinsCount: metrics.checkinsCount,
        imagesUploaded: metrics.imagesUploaded,
        storageUsedMB: metrics.storageUsedMB,
        apiCallsCount: metrics.apiCallsCount,
      }));
    return ok(yearlyMetrics);
  }

  async getCurrentMonthUsage(
    userId: string,
  ): Promise<Result<UsageMetricsSummary, UserRepositoryError>> {
    const now = new Date();
    return this.getMonthlyUsage(userId, now.getMonth() + 1, now.getFullYear());
  }

  async getAggregatedUsageByPlan(
    _plan: SubscriptionPlan,
    startDate: Date,
    _endDate: Date,
  ): Promise<Result<UsageMetricsSummary, UserRepositoryError>> {
    // Mock implementation - returns zeros
    return ok({
      month: startDate.getMonth() + 1,
      year: startDate.getFullYear(),
      regionsCreated: 0,
      placesCreated: 0,
      checkinsCount: 0,
      imagesUploaded: 0,
      storageUsedMB: 0,
      apiCallsCount: 0,
    });
  }

  // Test helper methods
  addUsageMetrics(metrics: UsageMetrics): void {
    this.usageMetrics.set(metrics.id, metrics);
  }

  reset(): void {
    this.usageMetrics.clear();
  }
}
