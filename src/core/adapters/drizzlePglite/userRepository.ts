import { and, count, desc, eq, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import {
  type EmailVerificationTokenRepository,
  type NotificationSettingsRepository,
  type PasswordResetTokenRepository,
  type UserRepository,
  UserRepositoryError,
  type UserSessionRepository,
  type UserSubscriptionRepository,
} from "@/core/domain/user/ports/userRepository";
import type {
  CreateUserParams,
  EmailVerificationToken,
  ListUsersQuery,
  NotificationSettings,
  PasswordResetToken,
  UpdateUserProfileParams,
  User,
  UserRole,
  UserSession,
  UserStatus,
  UserSubscription,
} from "@/core/domain/user/types";
import {
  emailVerificationTokenSchema,
  notificationSettingsSchema,
  passwordResetTokenSchema,
  userSchema,
  userSessionSchema,
  userSubscriptionSchema,
} from "@/core/domain/user/types";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import {
  emailVerificationTokens,
  notificationSettings,
  passwordResetTokens,
  userSessions,
  userSubscriptions,
  users,
} from "./schema";

export class DrizzlePgliteUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateUserParams,
  ): Promise<Result<User, UserRepositoryError>> {
    try {
      const result = await this.db
        .insert(users)
        .values({
          email: params.email,
          hashedPassword: params.password,
          name: params.name,
          bio: params.bio,
          avatar: params.avatar,
        })
        .returning();

      const user = result[0];
      if (!user) {
        return err(new UserRepositoryError("Failed to create user"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new UserRepositoryError("Invalid user data", undefined, error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError("Failed to create user", undefined, error),
      );
    }
  }

  async findById(
    id: string,
  ): Promise<Result<User | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(userSchema, result[0]).mapErr((error) => {
        return new UserRepositoryError("Invalid user data", undefined, error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError("Failed to find user by ID", undefined, error),
      );
    }
  }

  async findByEmail(
    email: string,
  ): Promise<Result<User | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(userSchema, result[0]).mapErr((error) => {
        return new UserRepositoryError("Invalid user data", undefined, error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to find user by email",
          undefined,
          error,
        ),
      );
    }
  }

  async updateProfile(
    id: string,
    params: UpdateUserProfileParams,
  ): Promise<Result<User, UserRepositoryError>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (params.name !== undefined) updateData.name = params.name;
      if (params.bio !== undefined) updateData.bio = params.bio;
      if (params.avatar !== undefined) updateData.avatar = params.avatar;

      const result = await this.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      const user = result[0];
      if (!user) {
        return err(new UserRepositoryError("User not found"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new UserRepositoryError("Invalid user data", undefined, error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to update user profile",
          undefined,
          error,
        ),
      );
    }
  }

  async updatePassword(
    id: string,
    hashedPassword: string,
  ): Promise<Result<User, UserRepositoryError>> {
    try {
      const result = await this.db
        .update(users)
        .set({ hashedPassword })
        .where(eq(users.id, id))
        .returning();

      const user = result[0];
      if (!user) {
        return err(new UserRepositoryError("User not found"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new UserRepositoryError("Invalid user data", undefined, error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to update user password",
          undefined,
          error,
        ),
      );
    }
  }

  async updateRole(
    id: string,
    role: UserRole,
  ): Promise<Result<User, UserRepositoryError>> {
    try {
      const result = await this.db
        .update(users)
        .set({ role })
        .where(eq(users.id, id))
        .returning();

      const user = result[0];
      if (!user) {
        return err(new UserRepositoryError("User not found"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new UserRepositoryError("Invalid user data", undefined, error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError("Failed to update user role", undefined, error),
      );
    }
  }

  async updateStatus(
    id: string,
    status: UserStatus,
  ): Promise<Result<User, UserRepositoryError>> {
    try {
      const result = await this.db
        .update(users)
        .set({ status })
        .where(eq(users.id, id))
        .returning();

      const user = result[0];
      if (!user) {
        return err(new UserRepositoryError("User not found"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new UserRepositoryError("Invalid user data", undefined, error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to update user status",
          undefined,
          error,
        ),
      );
    }
  }

  async verifyEmail(id: string): Promise<Result<User, UserRepositoryError>> {
    try {
      const result = await this.db
        .update(users)
        .set({
          emailVerified: true,
          emailVerifiedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      const user = result[0];
      if (!user) {
        return err(new UserRepositoryError("User not found"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new UserRepositoryError("Invalid user data", undefined, error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to verify user email",
          undefined,
          error,
        ),
      );
    }
  }

  async updateLastLogin(
    id: string,
  ): Promise<Result<User, UserRepositoryError>> {
    try {
      const result = await this.db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      const user = result[0];
      if (!user) {
        return err(new UserRepositoryError("User not found"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new UserRepositoryError("Invalid user data", undefined, error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to update last login",
          undefined,
          error,
        ),
      );
    }
  }

  async list(
    query: ListUsersQuery,
  ): Promise<Result<{ items: User[]; count: number }, UserRepositoryError>> {
    try {
      const { pagination, filter } = query;
      const limit = pagination.limit;
      const offset = (pagination.page - 1) * pagination.limit;

      const filters = [
        filter?.role ? eq(users.role, filter.role) : undefined,
        filter?.status ? eq(users.status, filter.status) : undefined,
        filter?.keyword ? like(users.name, `%${filter.keyword}%`) : undefined,
      ].filter((filter) => filter !== undefined);

      const whereCondition = filters.length > 0 ? and(...filters) : sql`1=1`;

      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(users)
          .where(whereCondition)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(users.createdAt)),
        this.db.select({ count: count() }).from(users).where(whereCondition),
      ]);

      const validatedItems = items
        .map((item) => validate(userSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      return ok({
        items: validatedItems,
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(
        new UserRepositoryError("Failed to list users", undefined, error),
      );
    }
  }

  async delete(id: string): Promise<Result<void, UserRepositoryError>> {
    try {
      await this.db.delete(users).where(eq(users.id, id));

      return ok(undefined);
    } catch (error) {
      return err(
        new UserRepositoryError("Failed to delete user", undefined, error),
      );
    }
  }

  async checkEmailAvailability(
    email: string,
  ): Promise<Result<boolean, UserRepositoryError>> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(users)
        .where(eq(users.email, email));

      const userCount = Number(result[0]?.count || 0);
      return ok(userCount === 0);
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to check email availability",
          undefined,
          error,
        ),
      );
    }
  }
}

export class DrizzlePgliteUserSubscriptionRepository
  implements UserSubscriptionRepository
{
  constructor(private readonly db: Database) {}

  async create(
    subscription: Omit<UserSubscription, "id" | "createdAt" | "updatedAt">,
  ): Promise<Result<UserSubscription, UserRepositoryError>> {
    try {
      const result = await this.db
        .insert(userSubscriptions)
        .values({
          userId: subscription.userId,
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        })
        .returning();

      const userSubscription = result[0];
      if (!userSubscription) {
        return err(new UserRepositoryError("Failed to create subscription"));
      }

      return validate(userSubscriptionSchema, userSubscription).mapErr(
        (error) => {
          return new UserRepositoryError(
            "Invalid subscription data",
            undefined,
            error,
          );
        },
      );
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to create user subscription",
          undefined,
          error,
        ),
      );
    }
  }

  async findByUserId(
    userId: string,
  ): Promise<Result<UserSubscription | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId))
        .limit(1);

      const subscription = result[0];
      if (!subscription) {
        return ok(null);
      }

      return validate(userSubscriptionSchema, subscription).mapErr((error) => {
        return new UserRepositoryError(
          "Invalid subscription data",
          undefined,
          error,
        );
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to find user subscription",
          undefined,
          error,
        ),
      );
    }
  }

  async update(
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
  ): Promise<Result<UserSubscription, UserRepositoryError>> {
    try {
      const result = await this.db
        .update(userSubscriptions)
        .set(params)
        .where(eq(userSubscriptions.id, id))
        .returning();

      const subscription = result[0];
      if (!subscription) {
        return err(new UserRepositoryError("Subscription not found"));
      }

      return validate(userSubscriptionSchema, subscription).mapErr((error) => {
        return new UserRepositoryError(
          "Invalid subscription data",
          undefined,
          error,
        );
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to update user subscription",
          undefined,
          error,
        ),
      );
    }
  }

  async cancel(
    id: string,
  ): Promise<Result<UserSubscription, UserRepositoryError>> {
    try {
      const result = await this.db
        .update(userSubscriptions)
        .set({
          cancelAtPeriodEnd: true,
        })
        .where(eq(userSubscriptions.id, id))
        .returning();

      const subscription = result[0];
      if (!subscription) {
        return err(new UserRepositoryError("Subscription not found"));
      }

      return validate(userSubscriptionSchema, subscription).mapErr((error) => {
        return new UserRepositoryError(
          "Invalid subscription data",
          undefined,
          error,
        );
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to cancel user subscription",
          undefined,
          error,
        ),
      );
    }
  }
}

export class DrizzlePgliteNotificationSettingsRepository
  implements NotificationSettingsRepository
{
  constructor(private readonly db: Database) {}

  async create(
    settings: Omit<NotificationSettings, "id" | "createdAt" | "updatedAt">,
  ): Promise<Result<NotificationSettings, UserRepositoryError>> {
    try {
      const result = await this.db
        .insert(notificationSettings)
        .values({
          userId: settings.userId,
          emailNotifications: settings.emailNotifications,
          checkinNotifications: settings.checkinNotifications,
          editorInviteNotifications: settings.editorInviteNotifications,
          systemNotifications: settings.systemNotifications,
        })
        .returning();

      const notificationSetting = result[0];
      if (!notificationSetting) {
        return err(
          new UserRepositoryError("Failed to create notification settings"),
        );
      }

      return validate(notificationSettingsSchema, notificationSetting).mapErr(
        (error) => {
          return new UserRepositoryError(
            "Invalid notification settings data",
            undefined,
            error,
          );
        },
      );
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to create notification settings",
          undefined,
          error,
        ),
      );
    }
  }

  async findByUserId(
    userId: string,
  ): Promise<Result<NotificationSettings | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(notificationSettingsSchema, result[0]).mapErr((error) => {
        return new UserRepositoryError(
          "Invalid notification settings data",
          undefined,
          error,
        );
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to find notification settings",
          undefined,
          error,
        ),
      );
    }
  }

  async update(
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
  ): Promise<Result<NotificationSettings, UserRepositoryError>> {
    try {
      const result = await this.db
        .update(notificationSettings)
        .set(params)
        .where(eq(notificationSettings.id, id))
        .returning();

      const notificationSetting = result[0];
      if (!notificationSetting) {
        return err(new UserRepositoryError("Notification settings not found"));
      }

      return validate(notificationSettingsSchema, notificationSetting).mapErr(
        (error) => {
          return new UserRepositoryError(
            "Invalid notification settings data",
            undefined,
            error,
          );
        },
      );
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to update notification settings",
          undefined,
          error,
        ),
      );
    }
  }
}

export class DrizzlePgliteUserSessionRepository
  implements UserSessionRepository
{
  constructor(private readonly db: Database) {}

  async create(
    session: Omit<UserSession, "id" | "createdAt">,
  ): Promise<Result<UserSession, UserRepositoryError>> {
    try {
      const result = await this.db
        .insert(userSessions)
        .values({
          userId: session.userId,
          token: session.token,
          expiresAt: session.expiresAt,
        })
        .returning();

      const userSession = result[0];
      if (!userSession) {
        return err(new UserRepositoryError("Failed to create user session"));
      }

      return validate(userSessionSchema, userSession).mapErr((error) => {
        return new UserRepositoryError(
          "Invalid user session data",
          undefined,
          error,
        );
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to create user session",
          undefined,
          error,
        ),
      );
    }
  }

  async findByToken(
    token: string,
  ): Promise<Result<UserSession | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(userSessions)
        .where(eq(userSessions.token, token))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(userSessionSchema, result[0]).mapErr((error) => {
        return new UserRepositoryError(
          "Invalid user session data",
          undefined,
          error,
        );
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to find user session",
          undefined,
          error,
        ),
      );
    }
  }

  async deleteByToken(
    token: string,
  ): Promise<Result<void, UserRepositoryError>> {
    try {
      await this.db.delete(userSessions).where(eq(userSessions.token, token));
      return ok(undefined);
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to delete user session",
          undefined,
          error,
        ),
      );
    }
  }

  async deleteByUserId(
    userId: string,
  ): Promise<Result<void, UserRepositoryError>> {
    try {
      await this.db.delete(userSessions).where(eq(userSessions.userId, userId));
      return ok(undefined);
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to delete user sessions",
          undefined,
          error,
        ),
      );
    }
  }

  async deleteExpired(): Promise<Result<number, UserRepositoryError>> {
    try {
      const result = await this.db
        .delete(userSessions)
        .where(sql`${userSessions.expiresAt} < NOW()`)
        .returning();

      return ok(result.length);
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to delete expired sessions",
          undefined,
          error,
        ),
      );
    }
  }
}

export class DrizzlePgliteEmailVerificationTokenRepository
  implements EmailVerificationTokenRepository
{
  constructor(private readonly db: Database) {}

  async create(
    token: Omit<EmailVerificationToken, "id" | "createdAt">,
  ): Promise<Result<EmailVerificationToken, UserRepositoryError>> {
    try {
      const result = await this.db
        .insert(emailVerificationTokens)
        .values({
          userId: token.userId,
          token: token.token,
          expiresAt: token.expiresAt,
          usedAt: token.usedAt,
        })
        .returning();

      const emailToken = result[0];
      if (!emailToken) {
        return err(
          new UserRepositoryError("Failed to create email verification token"),
        );
      }

      return validate(emailVerificationTokenSchema, emailToken).mapErr(
        (error) => {
          return new UserRepositoryError(
            "Invalid email verification token data",
            undefined,
            error,
          );
        },
      );
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to create email verification token",
          undefined,
          error,
        ),
      );
    }
  }

  async findByToken(
    token: string,
  ): Promise<Result<EmailVerificationToken | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(emailVerificationTokens)
        .where(eq(emailVerificationTokens.token, token))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(emailVerificationTokenSchema, result[0]).mapErr(
        (error) => {
          return new UserRepositoryError(
            "Invalid email verification token data",
            undefined,
            error,
          );
        },
      );
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to find email verification token",
          undefined,
          error,
        ),
      );
    }
  }

  async markAsUsed(
    id: string,
  ): Promise<Result<EmailVerificationToken, UserRepositoryError>> {
    try {
      const result = await this.db
        .update(emailVerificationTokens)
        .set({ usedAt: new Date() })
        .where(eq(emailVerificationTokens.id, id))
        .returning();

      const emailToken = result[0];
      if (!emailToken) {
        return err(
          new UserRepositoryError("Email verification token not found"),
        );
      }

      return validate(emailVerificationTokenSchema, emailToken).mapErr(
        (error) => {
          return new UserRepositoryError(
            "Invalid email verification token data",
            undefined,
            error,
          );
        },
      );
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to mark email verification token as used",
          undefined,
          error,
        ),
      );
    }
  }

  async deleteExpired(): Promise<Result<number, UserRepositoryError>> {
    try {
      const result = await this.db
        .delete(emailVerificationTokens)
        .where(sql`${emailVerificationTokens.expiresAt} < NOW()`)
        .returning();

      return ok(result.length);
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to delete expired email verification tokens",
          undefined,
          error,
        ),
      );
    }
  }
}

export class DrizzlePglitePasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  constructor(private readonly db: Database) {}

  async create(
    token: Omit<PasswordResetToken, "id" | "createdAt">,
  ): Promise<Result<PasswordResetToken, UserRepositoryError>> {
    try {
      const result = await this.db
        .insert(passwordResetTokens)
        .values({
          userId: token.userId,
          token: token.token,
          expiresAt: token.expiresAt,
          usedAt: token.usedAt,
        })
        .returning();

      const resetToken = result[0];
      if (!resetToken) {
        return err(
          new UserRepositoryError("Failed to create password reset token"),
        );
      }

      return validate(passwordResetTokenSchema, resetToken).mapErr((error) => {
        return new UserRepositoryError(
          "Invalid password reset token data",
          undefined,
          error,
        );
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to create password reset token",
          undefined,
          error,
        ),
      );
    }
  }

  async findByToken(
    token: string,
  ): Promise<Result<PasswordResetToken | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(passwordResetTokenSchema, result[0]).mapErr((error) => {
        return new UserRepositoryError(
          "Invalid password reset token data",
          undefined,
          error,
        );
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to find password reset token",
          undefined,
          error,
        ),
      );
    }
  }

  async markAsUsed(
    id: string,
  ): Promise<Result<PasswordResetToken, UserRepositoryError>> {
    try {
      const result = await this.db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, id))
        .returning();

      const resetToken = result[0];
      if (!resetToken) {
        return err(new UserRepositoryError("Password reset token not found"));
      }

      return validate(passwordResetTokenSchema, resetToken).mapErr((error) => {
        return new UserRepositoryError(
          "Invalid password reset token data",
          undefined,
          error,
        );
      });
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to mark password reset token as used",
          undefined,
          error,
        ),
      );
    }
  }

  async deleteExpired(): Promise<Result<number, UserRepositoryError>> {
    try {
      const result = await this.db
        .delete(passwordResetTokens)
        .where(sql`${passwordResetTokens.expiresAt} < NOW()`)
        .returning();

      return ok(result.length);
    } catch (error) {
      return err(
        new UserRepositoryError(
          "Failed to delete expired password reset tokens",
          undefined,
          error,
        ),
      );
    }
  }
}
