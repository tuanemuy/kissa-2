import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";
import { USER } from "../constants";

export const userRoleSchema = z.enum(["visitor", "editor", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userStatusSchema = z.enum(["active", "suspended", "deleted"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const subscriptionStatusSchema = z.enum([
  "none",
  "trial",
  "active",
  "expired",
  "cancelled",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const subscriptionPlanSchema = z.enum(["free", "standard", "premium"]);
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  hashedPassword: z.string(),
  name: z.string().min(USER.MIN_NAME_LENGTH).max(USER.MAX_NAME_LENGTH),
  bio: z.string().max(USER.MAX_BIO_LENGTH).optional(),
  avatar: z.string().url().optional(),
  role: userRoleSchema,
  status: userStatusSchema,
  emailVerified: z.boolean(),
  emailVerifiedAt: z.date().optional(),
  lastLoginAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof userSchema>;

export const userSubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  plan: subscriptionPlanSchema,
  status: subscriptionStatusSchema,
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  cancelAtPeriodEnd: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UserSubscription = z.infer<typeof userSubscriptionSchema>;

export const notificationSettingsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  emailNotifications: z.boolean(),
  checkinNotifications: z.boolean(),
  editorInviteNotifications: z.boolean(),
  systemNotifications: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(USER.MIN_PASSWORD_LENGTH)
    .max(USER.MAX_PASSWORD_LENGTH),
  name: z.string().min(USER.MIN_NAME_LENGTH).max(USER.MAX_NAME_LENGTH),
  bio: z.string().max(USER.MAX_BIO_LENGTH).optional(),
  avatar: z.string().url().optional(),
});
export type CreateUserParams = z.infer<typeof createUserSchema>;

export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .min(USER.MIN_NAME_LENGTH)
    .max(USER.MAX_NAME_LENGTH)
    .optional(),
  bio: z.string().max(USER.MAX_BIO_LENGTH).optional(),
  avatar: z.string().url().optional(),
});
export type UpdateUserProfileParams = z.infer<typeof updateUserProfileSchema>;

export const updateUserPasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(USER.MIN_PASSWORD_LENGTH)
    .max(USER.MAX_PASSWORD_LENGTH),
  newPassword: z
    .string()
    .min(USER.MIN_PASSWORD_LENGTH)
    .max(USER.MAX_PASSWORD_LENGTH),
});
export type UpdateUserPasswordParams = z.infer<typeof updateUserPasswordSchema>;

export const loginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(USER.MIN_PASSWORD_LENGTH)
    .max(USER.MAX_PASSWORD_LENGTH),
});
export type PasswordResetParams = z.infer<typeof passwordResetSchema>;

export const listUsersQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      role: userRoleSchema.optional(),
      status: userStatusSchema.optional(),
      keyword: z.string().optional(),
    })
    .optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const userSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
});
export type UserSession = z.infer<typeof userSessionSchema>;

export const passwordResetTokenSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
  usedAt: z.date().optional(),
  createdAt: z.date(),
});
export type PasswordResetToken = z.infer<typeof passwordResetTokenSchema>;

export const emailVerificationTokenSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
  usedAt: z.date().optional(),
  createdAt: z.date(),
});
export type EmailVerificationToken = z.infer<
  typeof emailVerificationTokenSchema
>;

/**
 * Domain-level user utility functions
 * These functions contain business logic related to user authorization and display
 */

/**
 * Check if user has a specific role
 */
export function hasRole(
  user: User | null,
  role: "visitor" | "editor" | "admin",
): boolean {
  if (!user) return false;

  // Admin has all permissions
  if (user.role === "admin") return true;

  // Editor has editor and visitor permissions
  if (user.role === "editor" && (role === "editor" || role === "visitor"))
    return true;

  // Visitor has only visitor permissions
  if (user.role === "visitor" && role === "visitor") return true;

  return false;
}

/**
 * Check if user has minimum required role
 */
export function hasMinimumRole(
  user: User | null,
  minimumRole: "visitor" | "editor" | "admin",
): boolean {
  if (!user) return false;

  const roleHierarchy = { visitor: 1, editor: 2, admin: 3 };
  const userRoleLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[minimumRole] || 0;

  return userRoleLevel >= requiredLevel;
}

/**
 * Get user display name
 */
export function getDisplayName(user: User | null): string {
  if (!user) return "Guest";
  return user.name || user.email.split("@")[0];
}

/**
 * Check if user is active and can perform actions
 */
export function isActive(user: User | null): boolean {
  if (!user) return false;
  return user.status === "active";
}

/**
 * Check if user email is verified
 */
export function isEmailVerified(user: User | null): boolean {
  if (!user) return false;
  return user.emailVerified;
}

// Backward compatibility - export as UserDomain namespace
export const UserDomain = {
  hasRole,
  hasMinimumRole,
  getDisplayName,
  isActive,
  isEmailVerified,
};

export const updateUserSubscriptionParamsSchema = z.object({
  plan: subscriptionPlanSchema.optional(),
  status: subscriptionStatusSchema.optional(),
  currentPeriodStart: z.date().optional(),
  currentPeriodEnd: z.date().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});
export type UpdateUserSubscriptionParams = z.infer<
  typeof updateUserSubscriptionParamsSchema
>;

// Payment method types
export const paymentMethodTypeSchema = z.enum([
  "credit_card",
  "bank_transfer",
  "paypal",
]);
export type PaymentMethodType = z.infer<typeof paymentMethodTypeSchema>;

export const paymentMethodSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: paymentMethodTypeSchema,
  isDefault: z.boolean(),
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2024).max(2050).optional(),
  paypalEmail: z.string().email().optional(),
  bankAccountLast4: z.string().length(4).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const createPaymentMethodSchema = z.object({
  userId: z.string().uuid(),
  type: paymentMethodTypeSchema,
  isDefault: z.boolean().default(false),
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2024).max(2050).optional(),
  paypalEmail: z.string().email().optional(),
  bankAccountLast4: z.string().length(4).optional(),
});
export type CreatePaymentMethodParams = z.infer<
  typeof createPaymentMethodSchema
>;

// Billing history types
export const billingStatusSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled",
]);
export type BillingStatus = z.infer<typeof billingStatusSchema>;

export const billingHistorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  paymentMethodId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  status: billingStatusSchema,
  billingPeriodStart: z.date(),
  billingPeriodEnd: z.date(),
  paymentAttemptedAt: z.date().optional(),
  paidAt: z.date().optional(),
  failedAt: z.date().optional(),
  refundedAt: z.date().optional(),
  failureReason: z.string().optional(),
  invoiceUrl: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type BillingHistory = z.infer<typeof billingHistorySchema>;

export const createBillingHistorySchema = z.object({
  userId: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  paymentMethodId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  status: billingStatusSchema.default("pending"),
  billingPeriodStart: z.date(),
  billingPeriodEnd: z.date(),
});
export type CreateBillingHistoryParams = z.infer<
  typeof createBillingHistorySchema
>;

// Usage metrics types
export const usageMetricsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
  regionsCreated: z.number().int().min(0).default(0),
  placesCreated: z.number().int().min(0).default(0),
  checkinsCount: z.number().int().min(0).default(0),
  imagesUploaded: z.number().int().min(0).default(0),
  storageUsedMB: z.number().min(0).default(0),
  apiCallsCount: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UsageMetrics = z.infer<typeof usageMetricsSchema>;

export const usageMetricsSummarySchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
  regionsCreated: z.number().int().min(0),
  placesCreated: z.number().int().min(0),
  checkinsCount: z.number().int().min(0),
  imagesUploaded: z.number().int().min(0),
  storageUsedMB: z.number().min(0),
  apiCallsCount: z.number().int().min(0),
});
export type UsageMetricsSummary = z.infer<typeof usageMetricsSummarySchema>;
