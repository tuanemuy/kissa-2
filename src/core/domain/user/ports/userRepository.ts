import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import type {
  BillingHistory,
  CreateBillingHistoryParams,
  CreatePaymentMethodParams,
  CreateUserParams,
  EmailVerificationToken,
  ListUsersQuery,
  NotificationSettings,
  PasswordResetToken,
  PaymentMethod,
  SubscriptionPlan,
  SubscriptionStatus,
  UpdateUserProfileParams,
  UsageMetrics,
  UsageMetricsSummary,
  User,
  UserRole,
  UserSession,
  UserStatus,
  UserSubscription,
} from "../types";

export class UserRepositoryError extends AnyError {
  override readonly name = "UserRepositoryError";
}

export interface UserRepository {
  create(params: CreateUserParams): Promise<Result<User, UserRepositoryError>>;

  findById(id: string): Promise<Result<User | null, UserRepositoryError>>;

  findByEmail(email: string): Promise<Result<User | null, UserRepositoryError>>;

  updateProfile(
    id: string,
    params: UpdateUserProfileParams,
  ): Promise<Result<User, UserRepositoryError>>;

  updatePassword(
    id: string,
    hashedPassword: string,
  ): Promise<Result<User, UserRepositoryError>>;

  updateRole(
    id: string,
    role: UserRole,
  ): Promise<Result<User, UserRepositoryError>>;

  updateStatus(
    id: string,
    status: UserStatus,
  ): Promise<Result<User, UserRepositoryError>>;

  verifyEmail(id: string): Promise<Result<User, UserRepositoryError>>;

  updateLastLogin(id: string): Promise<Result<User, UserRepositoryError>>;

  list(
    query: ListUsersQuery,
  ): Promise<Result<{ items: User[]; count: number }, UserRepositoryError>>;

  delete(id: string): Promise<Result<void, UserRepositoryError>>;

  checkEmailAvailability(
    email: string,
  ): Promise<Result<boolean, UserRepositoryError>>;
}

export interface UserSubscriptionRepository {
  create(
    subscription: Omit<UserSubscription, "id" | "createdAt" | "updatedAt">,
  ): Promise<Result<UserSubscription, UserRepositoryError>>;

  findByUserId(
    userId: string,
  ): Promise<Result<UserSubscription | null, UserRepositoryError>>;

  update(
    id: string,
    params: Partial<
      Pick<
        UserSubscription,
        | "plan"
        | "status"
        | "currentPeriodStart"
        | "currentPeriodEnd"
        | "cancelAtPeriodEnd"
      >
    >,
  ): Promise<Result<UserSubscription, UserRepositoryError>>;

  cancel(id: string): Promise<Result<UserSubscription, UserRepositoryError>>;

  list(query: {
    pagination: {
      page: number;
      limit: number;
      order: "asc" | "desc";
      orderBy: "createdAt" | "updatedAt";
    };
    filter: {
      status?: SubscriptionStatus;
      plan?: SubscriptionPlan;
      dateRange?: {
        from: Date;
        to: Date;
      };
    };
  }): Promise<
    Result<{ items: UserSubscription[]; count: number }, UserRepositoryError>
  >;

  countByStatus(): Promise<
    Result<Record<SubscriptionStatus, number>, UserRepositoryError>
  >;

  countByPlan(): Promise<
    Result<Record<SubscriptionPlan, number>, UserRepositoryError>
  >;
}

export interface NotificationSettingsRepository {
  create(
    settings: Omit<NotificationSettings, "id" | "createdAt" | "updatedAt">,
  ): Promise<Result<NotificationSettings, UserRepositoryError>>;

  findByUserId(
    userId: string,
  ): Promise<Result<NotificationSettings | null, UserRepositoryError>>;

  update(
    id: string,
    params: Partial<
      Pick<
        NotificationSettings,
        | "emailNotifications"
        | "checkinNotifications"
        | "editorInviteNotifications"
        | "systemNotifications"
      >
    >,
  ): Promise<Result<NotificationSettings, UserRepositoryError>>;
}

export interface UserSessionRepository {
  create(
    session: Omit<UserSession, "id" | "createdAt">,
  ): Promise<Result<UserSession, UserRepositoryError>>;

  findByToken(
    token: string,
  ): Promise<Result<UserSession | null, UserRepositoryError>>;

  deleteByToken(token: string): Promise<Result<void, UserRepositoryError>>;

  deleteByUserId(userId: string): Promise<Result<void, UserRepositoryError>>;

  deleteExpired(): Promise<Result<number, UserRepositoryError>>;
}

export interface PasswordResetTokenRepository {
  create(
    token: Omit<PasswordResetToken, "id" | "createdAt">,
  ): Promise<Result<PasswordResetToken, UserRepositoryError>>;

  findByToken(
    token: string,
  ): Promise<Result<PasswordResetToken | null, UserRepositoryError>>;

  markAsUsed(
    id: string,
  ): Promise<Result<PasswordResetToken, UserRepositoryError>>;

  deleteExpired(): Promise<Result<number, UserRepositoryError>>;
}

export interface EmailVerificationTokenRepository {
  create(
    token: Omit<EmailVerificationToken, "id" | "createdAt">,
  ): Promise<Result<EmailVerificationToken, UserRepositoryError>>;

  findByToken(
    token: string,
  ): Promise<Result<EmailVerificationToken | null, UserRepositoryError>>;

  markAsUsed(
    id: string,
  ): Promise<Result<EmailVerificationToken, UserRepositoryError>>;

  deleteExpired(): Promise<Result<number, UserRepositoryError>>;
}

export interface PaymentMethodRepository {
  create(
    params: CreatePaymentMethodParams,
  ): Promise<Result<PaymentMethod, UserRepositoryError>>;

  findByUserId(
    userId: string,
  ): Promise<Result<PaymentMethod[], UserRepositoryError>>;

  findById(
    id: string,
  ): Promise<Result<PaymentMethod | null, UserRepositoryError>>;

  update(
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
  ): Promise<Result<PaymentMethod, UserRepositoryError>>;

  setAsDefault(
    id: string,
    userId: string,
  ): Promise<Result<PaymentMethod, UserRepositoryError>>;

  delete(id: string): Promise<Result<void, UserRepositoryError>>;

  findDefaultByUserId(
    userId: string,
  ): Promise<Result<PaymentMethod | null, UserRepositoryError>>;
}

export interface BillingHistoryRepository {
  create(
    params: CreateBillingHistoryParams,
  ): Promise<Result<BillingHistory, UserRepositoryError>>;

  findByUserId(
    userId: string,
    pagination: {
      page: number;
      limit: number;
      order: "asc" | "desc";
      orderBy: "createdAt" | "paidAt";
    },
  ): Promise<
    Result<{ items: BillingHistory[]; count: number }, UserRepositoryError>
  >;

  findById(
    id: string,
  ): Promise<Result<BillingHistory | null, UserRepositoryError>>;

  updateStatus(
    id: string,
    status: BillingHistory["status"],
    metadata?: {
      paidAt?: Date;
      failedAt?: Date;
      refundedAt?: Date;
      failureReason?: string;
      invoiceUrl?: string;
    },
  ): Promise<Result<BillingHistory, UserRepositoryError>>;

  findBySubscriptionId(
    subscriptionId: string,
  ): Promise<Result<BillingHistory[], UserRepositoryError>>;

  getTotalRevenue(): Promise<Result<number, UserRepositoryError>>;

  getRevenueByPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<Result<number, UserRepositoryError>>;
}

export interface UsageMetricsRepository {
  create(
    metrics: Omit<UsageMetrics, "id" | "createdAt" | "updatedAt">,
  ): Promise<Result<UsageMetrics, UserRepositoryError>>;

  findByUserAndMonth(
    userId: string,
    month: number,
    year: number,
  ): Promise<Result<UsageMetrics | null, UserRepositoryError>>;

  findByUserId(
    userId: string,
    limit?: number,
  ): Promise<Result<UsageMetrics[], UserRepositoryError>>;

  update(
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
  ): Promise<Result<UsageMetrics, UserRepositoryError>>;

  incrementUsage(
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
  ): Promise<Result<UsageMetrics, UserRepositoryError>>;

  getMonthlyUsage(
    userId: string,
    month: number,
    year: number,
  ): Promise<Result<UsageMetricsSummary, UserRepositoryError>>;

  getYearlyUsage(
    userId: string,
    year: number,
  ): Promise<Result<UsageMetricsSummary[], UserRepositoryError>>;

  getCurrentMonthUsage(
    userId: string,
  ): Promise<Result<UsageMetricsSummary, UserRepositoryError>>;

  getAggregatedUsageByPlan(
    plan: SubscriptionPlan,
    startDate: Date,
    endDate: Date,
  ): Promise<Result<UsageMetricsSummary, UserRepositoryError>>;
}
