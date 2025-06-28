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
