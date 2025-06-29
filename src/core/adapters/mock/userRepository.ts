import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
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

export class MockUserRepository implements UserRepository {
  private users = new Map<string, User>();
  private nextId = 1;

  constructor(initialUsers: User[] = []) {
    for (const user of initialUsers) {
      this.users.set(user.id, user);
    }
  }

  reset(): void {
    this.users.clear();
    this.nextId = 1;
  }

  addUser(user: User): void {
    this.users.set(user.id, user);
  }

  async create(
    params: CreateUserParams,
  ): Promise<Result<User, UserRepositoryError>> {
    const existingUser = Array.from(this.users.values()).find(
      (u) => u.email === params.email,
    );
    if (existingUser) {
      return err(new UserRepositoryError("Email already exists"));
    }

    const user: User = {
      id: uuidv7(),
      email: params.email,
      hashedPassword: params.password,
      name: params.name,
      bio: params.bio,
      avatar: params.avatar,
      role: "visitor",
      status: "active",
      emailVerified: false,
      emailVerifiedAt: undefined,
      lastLoginAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return ok(user);
  }

  async findById(
    id: string,
  ): Promise<Result<User | null, UserRepositoryError>> {
    const user = this.users.get(id);
    return ok(user || null);
  }

  async findByEmail(
    email: string,
  ): Promise<Result<User | null, UserRepositoryError>> {
    const user = Array.from(this.users.values()).find((u) => u.email === email);
    return ok(user || null);
  }

  async updateProfile(
    id: string,
    params: UpdateUserProfileParams,
  ): Promise<Result<User, UserRepositoryError>> {
    const user = this.users.get(id);
    if (!user) {
      return err(new UserRepositoryError("User not found"));
    }

    const updatedUser: User = {
      ...user,
      ...params,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return ok(updatedUser);
  }

  async updatePassword(
    id: string,
    hashedPassword: string,
  ): Promise<Result<User, UserRepositoryError>> {
    const user = this.users.get(id);
    if (!user) {
      return err(new UserRepositoryError("User not found"));
    }

    const updatedUser: User = {
      ...user,
      hashedPassword,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return ok(updatedUser);
  }

  async updateRole(
    id: string,
    role: UserRole,
  ): Promise<Result<User, UserRepositoryError>> {
    const user = this.users.get(id);
    if (!user) {
      return err(new UserRepositoryError("User not found"));
    }

    const updatedUser: User = {
      ...user,
      role,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return ok(updatedUser);
  }

  async updateStatus(
    id: string,
    status: UserStatus,
  ): Promise<Result<User, UserRepositoryError>> {
    const user = this.users.get(id);
    if (!user) {
      return err(new UserRepositoryError("User not found"));
    }

    const updatedUser: User = {
      ...user,
      status,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return ok(updatedUser);
  }

  async verifyEmail(id: string): Promise<Result<User, UserRepositoryError>> {
    const user = this.users.get(id);
    if (!user) {
      return err(new UserRepositoryError("User not found"));
    }

    const updatedUser: User = {
      ...user,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return ok(updatedUser);
  }

  async updateLastLogin(
    id: string,
  ): Promise<Result<User, UserRepositoryError>> {
    const user = this.users.get(id);
    if (!user) {
      return err(new UserRepositoryError("User not found"));
    }

    const updatedUser: User = {
      ...user,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return ok(updatedUser);
  }

  async list(
    query: ListUsersQuery,
  ): Promise<Result<{ items: User[]; count: number }, UserRepositoryError>> {
    let users = Array.from(this.users.values());

    if (query.filter) {
      if (query.filter.role) {
        users = users.filter((u) => u.role === query.filter?.role);
      }
      if (query.filter.status) {
        users = users.filter((u) => u.status === query.filter?.status);
      }
      if (query.filter.keyword) {
        const keyword = query.filter.keyword.toLowerCase();
        users = users.filter(
          (u) =>
            u.name.toLowerCase().includes(keyword) ||
            u.email.toLowerCase().includes(keyword),
        );
      }
    }

    const count = users.length;
    const { page, limit } = query.pagination;
    const offset = (page - 1) * limit;
    const items = users.slice(offset, offset + limit);

    return ok({ items, count });
  }

  async delete(id: string): Promise<Result<void, UserRepositoryError>> {
    if (!this.users.has(id)) {
      return err(new UserRepositoryError("User not found"));
    }

    this.users.delete(id);
    return ok(undefined);
  }

  async checkEmailAvailability(
    email: string,
  ): Promise<Result<boolean, UserRepositoryError>> {
    const user = Array.from(this.users.values()).find((u) => u.email === email);
    return ok(!user);
  }
}

export class MockUserSessionRepository implements UserSessionRepository {
  private sessions = new Map<string, UserSession>();

  constructor(initialSessions: UserSession[] = []) {
    for (const session of initialSessions) {
      this.sessions.set(session.token, session);
    }
  }

  reset(): void {
    this.sessions.clear();
  }

  async create(
    session: Omit<UserSession, "id" | "createdAt">,
  ): Promise<Result<UserSession, UserRepositoryError>> {
    const newSession: UserSession = {
      id: uuidv7(),
      ...session,
      createdAt: new Date(),
    };

    this.sessions.set(session.token, newSession);
    return ok(newSession);
  }

  async findByToken(
    token: string,
  ): Promise<Result<UserSession | null, UserRepositoryError>> {
    const session = this.sessions.get(token);
    return ok(session || null);
  }

  async deleteByToken(
    token: string,
  ): Promise<Result<void, UserRepositoryError>> {
    this.sessions.delete(token);
    return ok(undefined);
  }

  async deleteByUserId(
    userId: string,
  ): Promise<Result<void, UserRepositoryError>> {
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(token);
      }
    }
    return ok(undefined);
  }

  async deleteExpired(): Promise<Result<number, UserRepositoryError>> {
    const now = new Date();
    let deletedCount = 0;

    for (const [token, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(token);
        deletedCount++;
      }
    }

    return ok(deletedCount);
  }
}

export class MockUserSubscriptionRepository
  implements UserSubscriptionRepository
{
  private subscriptions = new Map<string, UserSubscription>();

  constructor(initialSubscriptions: UserSubscription[] = []) {
    for (const subscription of initialSubscriptions) {
      this.subscriptions.set(subscription.id, subscription);
    }
  }

  reset(): void {
    this.subscriptions.clear();
  }

  async create(
    subscription: Omit<UserSubscription, "id" | "createdAt" | "updatedAt">,
  ): Promise<Result<UserSubscription, UserRepositoryError>> {
    const newSubscription: UserSubscription = {
      id: uuidv7(),
      ...subscription,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.subscriptions.set(newSubscription.id, newSubscription);
    return ok(newSubscription);
  }

  async findByUserId(
    userId: string,
  ): Promise<Result<UserSubscription | null, UserRepositoryError>> {
    const subscription = Array.from(this.subscriptions.values()).find(
      (s) => s.userId === userId,
    );
    return ok(subscription || null);
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
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      return err(new UserRepositoryError("Subscription not found"));
    }

    const updatedSubscription: UserSubscription = {
      ...subscription,
      ...params,
      updatedAt: new Date(),
    };

    this.subscriptions.set(id, updatedSubscription);
    return ok(updatedSubscription);
  }

  async cancel(
    id: string,
  ): Promise<Result<UserSubscription, UserRepositoryError>> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      return err(new UserRepositoryError("Subscription not found"));
    }

    const updatedSubscription: UserSubscription = {
      ...subscription,
      cancelAtPeriodEnd: true,
      updatedAt: new Date(),
    };

    this.subscriptions.set(id, updatedSubscription);
    return ok(updatedSubscription);
  }
}

export class MockNotificationSettingsRepository
  implements NotificationSettingsRepository
{
  private settings = new Map<string, NotificationSettings>();

  constructor(initialSettings: NotificationSettings[] = []) {
    for (const setting of initialSettings) {
      this.settings.set(setting.id, setting);
    }
  }

  reset(): void {
    this.settings.clear();
  }

  async create(
    settings: Omit<NotificationSettings, "id" | "createdAt" | "updatedAt">,
  ): Promise<Result<NotificationSettings, UserRepositoryError>> {
    const newSettings: NotificationSettings = {
      id: uuidv7(),
      ...settings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.settings.set(newSettings.id, newSettings);
    return ok(newSettings);
  }

  async findByUserId(
    userId: string,
  ): Promise<Result<NotificationSettings | null, UserRepositoryError>> {
    const setting = Array.from(this.settings.values()).find(
      (s) => s.userId === userId,
    );
    return ok(setting || null);
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
    const setting = this.settings.get(id);
    if (!setting) {
      return err(new UserRepositoryError("Notification settings not found"));
    }

    const updatedSettings: NotificationSettings = {
      ...setting,
      ...params,
      updatedAt: new Date(),
    };

    this.settings.set(id, updatedSettings);
    return ok(updatedSettings);
  }
}

export class MockPasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  private tokens = new Map<string, PasswordResetToken>();

  constructor(initialTokens: PasswordResetToken[] = []) {
    for (const token of initialTokens) {
      this.tokens.set(token.id, token);
    }
  }

  reset(): void {
    this.tokens.clear();
  }

  async create(
    token: Omit<PasswordResetToken, "id" | "createdAt">,
  ): Promise<Result<PasswordResetToken, UserRepositoryError>> {
    const newToken: PasswordResetToken = {
      id: uuidv7(),
      ...token,
      createdAt: new Date(),
    };

    this.tokens.set(newToken.id, newToken);
    return ok(newToken);
  }

  async findByToken(
    token: string,
  ): Promise<Result<PasswordResetToken | null, UserRepositoryError>> {
    const resetToken = Array.from(this.tokens.values()).find(
      (t) => t.token === token,
    );
    return ok(resetToken || null);
  }

  async markAsUsed(
    id: string,
  ): Promise<Result<PasswordResetToken, UserRepositoryError>> {
    const token = this.tokens.get(id);
    if (!token) {
      return err(new UserRepositoryError("Token not found"));
    }

    const updatedToken: PasswordResetToken = {
      ...token,
      usedAt: new Date(),
    };

    this.tokens.set(id, updatedToken);
    return ok(updatedToken);
  }

  async deleteExpired(): Promise<Result<number, UserRepositoryError>> {
    const now = new Date();
    let deletedCount = 0;

    for (const [id, token] of this.tokens.entries()) {
      if (token.expiresAt < now) {
        this.tokens.delete(id);
        deletedCount++;
      }
    }

    return ok(deletedCount);
  }
}

export class MockEmailVerificationTokenRepository
  implements EmailVerificationTokenRepository
{
  private tokens = new Map<string, EmailVerificationToken>();

  constructor(initialTokens: EmailVerificationToken[] = []) {
    for (const token of initialTokens) {
      this.tokens.set(token.id, token);
    }
  }

  reset(): void {
    this.tokens.clear();
  }

  async create(
    token: Omit<EmailVerificationToken, "id" | "createdAt">,
  ): Promise<Result<EmailVerificationToken, UserRepositoryError>> {
    const newToken: EmailVerificationToken = {
      id: uuidv7(),
      ...token,
      createdAt: new Date(),
    };

    this.tokens.set(newToken.id, newToken);
    return ok(newToken);
  }

  async findByToken(
    token: string,
  ): Promise<Result<EmailVerificationToken | null, UserRepositoryError>> {
    const verificationToken = Array.from(this.tokens.values()).find(
      (t) => t.token === token,
    );
    return ok(verificationToken || null);
  }

  async markAsUsed(
    id: string,
  ): Promise<Result<EmailVerificationToken, UserRepositoryError>> {
    const token = this.tokens.get(id);
    if (!token) {
      return err(new UserRepositoryError("Token not found"));
    }

    const updatedToken: EmailVerificationToken = {
      ...token,
      usedAt: new Date(),
    };

    this.tokens.set(id, updatedToken);
    return ok(updatedToken);
  }

  async deleteExpired(): Promise<Result<number, UserRepositoryError>> {
    const now = new Date();
    let deletedCount = 0;

    for (const [id, token] of this.tokens.entries()) {
      if (token.expiresAt < now) {
        this.tokens.delete(id);
        deletedCount++;
      }
    }

    return ok(deletedCount);
  }
}
