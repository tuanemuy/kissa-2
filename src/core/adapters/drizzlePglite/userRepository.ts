import { and, asc, count, desc, eq, like, sql } from "drizzle-orm";
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
        return new UserRepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new UserRepositoryError("Failed to create user", error));
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
        return new UserRepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new UserRepositoryError("Failed to find user by ID", error));
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
        return new UserRepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError("Failed to find user by email", error),
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
        return new UserRepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError("Failed to update user profile", error),
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
        return new UserRepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError("Failed to update user password", error),
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
        return new UserRepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new UserRepositoryError("Failed to update user role", error));
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
        return new UserRepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(
        new UserRepositoryError("Failed to update user status", error),
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
        return new UserRepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new UserRepositoryError("Failed to verify user email", error));
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
        return new UserRepositoryError("Invalid user data", error);
      });
    } catch (error) {
      return err(new UserRepositoryError("Failed to update last login", error));
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

      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(users)
          .where(and(...filters))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(users.createdAt)),
        this.db
          .select({ count: count() })
          .from(users)
          .where(and(...filters)),
      ]);

      const validatedItems = items
        .map((item) => validate(userSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      return ok({
        items: validatedItems,
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new UserRepositoryError("Failed to list users", error));
    }
  }

  async delete(id: string): Promise<Result<void, UserRepositoryError>> {
    try {
      await this.db.delete(users).where(eq(users.id, id));

      return ok(undefined);
    } catch (error) {
      return err(new UserRepositoryError("Failed to delete user", error));
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
        new UserRepositoryError("Failed to check email availability", error),
      );
    }
  }
}
