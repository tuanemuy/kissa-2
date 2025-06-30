import { err, ok, type Result } from "neverthrow";
import {
  type SessionService,
  SessionServiceError,
} from "@/core/domain/user/ports/sessionService";
import type { User, UserSession } from "@/core/domain/user/types";
import { UserDomain } from "@/core/domain/user/types";

export class MockSessionService implements SessionService {
  private shouldFail = false;
  private sessions = new Map<string, UserSession>();
  private mockUsers = new Map<string, User>();

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  addMockUser(user: User): void {
    this.mockUsers.set(user.id, user);
  }

  addMockSession(session: UserSession): void {
    this.sessions.set(session.token, session);
  }

  clearSessions(): void {
    this.sessions.clear();
  }

  async getCurrentUser(
    token: string,
  ): Promise<Result<User | null, SessionServiceError>> {
    if (this.shouldFail) {
      return err(new SessionServiceError("Mock session service failure"));
    }

    const session = this.sessions.get(token);
    if (!session) {
      return ok(null);
    }

    // Check if session is expired
    const now = new Date();
    if (session.expiresAt < now) {
      this.sessions.delete(token);
      return ok(null);
    }

    const user = this.mockUsers.get(session.userId);
    if (!user || !UserDomain.isActive(user)) {
      return ok(null);
    }

    return ok(user);
  }

  async createSession(
    userId: string,
  ): Promise<Result<UserSession, SessionServiceError>> {
    if (this.shouldFail) {
      return err(new SessionServiceError("Mock session service failure"));
    }

    const token = `mock-token-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session: UserSession = {
      id: `session-${Date.now()}`,
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    };

    this.sessions.set(token, session);
    return ok(session);
  }

  async validateSession(
    token: string,
  ): Promise<Result<User | null, SessionServiceError>> {
    return this.getCurrentUser(token);
  }

  async invalidateSession(
    token: string,
  ): Promise<Result<void, SessionServiceError>> {
    if (this.shouldFail) {
      return err(new SessionServiceError("Mock session service failure"));
    }

    this.sessions.delete(token);
    return ok(undefined);
  }

  async invalidateAllUserSessions(
    userId: string,
  ): Promise<Result<void, SessionServiceError>> {
    if (this.shouldFail) {
      return err(new SessionServiceError("Mock session service failure"));
    }

    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(token);
      }
    }

    return ok(undefined);
  }

  async cleanupExpiredSessions(): Promise<Result<number, SessionServiceError>> {
    if (this.shouldFail) {
      return err(new SessionServiceError("Mock session service failure"));
    }

    const now = new Date();
    let count = 0;

    for (const [token, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(token);
        count++;
      }
    }

    return ok(count);
  }

  async extendSession(
    token: string,
    extendByHours = 24 * 7,
  ): Promise<Result<UserSession, SessionServiceError>> {
    if (this.shouldFail) {
      return err(new SessionServiceError("Mock session service failure"));
    }

    const session = this.sessions.get(token);
    if (!session) {
      return err(new SessionServiceError("Session not found"));
    }

    // Check if session is expired
    const now = new Date();
    if (session.expiresAt < now) {
      return err(new SessionServiceError("Session is expired"));
    }

    const newExpiresAt = new Date(Date.now() + extendByHours * 60 * 60 * 1000);
    const extendedSession: UserSession = {
      ...session,
      expiresAt: newExpiresAt,
    };

    this.sessions.set(token, extendedSession);
    return ok(extendedSession);
  }
}
