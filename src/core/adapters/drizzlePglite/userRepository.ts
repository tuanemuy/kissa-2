import { and, count, desc, eq, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import {
  type UserRepository,
  UserRepositoryError,
  type UserSubscriptionRepository,
} from "@/core/domain/user/ports/userRepository";
import type {
  CreateUserParams,
  ListUsersQuery,
  UpdateUserProfileParams,
  User,
  UserRole,
  UserStatus,
  UserSubscription,
} from "@/core/domain/user/types";
import { userSchema, userSubscriptionSchema } from "@/core/domain/user/types";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { userSubscriptions, users } from "./schema";

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
        this.db
          .select({ count: count() })
          .from(users)
          .where(whereCondition),
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
