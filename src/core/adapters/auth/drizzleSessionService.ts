import { err, ok, type Result } from "neverthrow";
import type { TokenGenerator } from "@/core/domain/user/ports/authService";
import {
  type SessionService,
  SessionServiceError,
} from "@/core/domain/user/ports/sessionService";
import type {
  UserRepository,
  UserSessionRepository,
} from "@/core/domain/user/ports/userRepository";
import type { User, UserSession } from "@/core/domain/user/types";
import { UserDomain } from "@/core/domain/user/types";

export class DrizzleSessionService implements SessionService {
  private readonly defaultSessionHours = 24 * 7; // 7 days

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
    private readonly tokenGenerator: TokenGenerator,
  ) {}

  async getCurrentUser(
    token: string,
  ): Promise<Result<User | null, SessionServiceError>> {
    try {
      // Find session by token
      const sessionResult = await this.userSessionRepository.findByToken(token);
      if (sessionResult.isErr()) {
        return err(
          new SessionServiceError(
            "Failed to find session",
            sessionResult.error,
          ),
        );
      }

      const session = sessionResult.value;
      if (!session) {
        return ok(null);
      }

      // Check if session is expired
      const now = new Date();
      if (session.expiresAt < now) {
        // Clean up expired session
        await this.userSessionRepository.deleteByToken(token);
        return ok(null);
      }

      // Get user by ID
      const userResult = await this.userRepository.findById(session.userId);
      if (userResult.isErr()) {
        return err(
          new SessionServiceError("Failed to find user", userResult.error),
        );
      }

      const user = userResult.value;
      if (!user || !UserDomain.isActive(user)) {
        return ok(null);
      }

      return ok(user);
    } catch (error) {
      return err(new SessionServiceError("Failed to get current user", error));
    }
  }

  async createSession(
    userId: string,
  ): Promise<Result<UserSession, SessionServiceError>> {
    try {
      // Generate session token
      const tokenResult = await this.tokenGenerator.generateSessionToken();
      if (tokenResult.isErr()) {
        return err(
          new SessionServiceError(
            "Failed to generate session token",
            tokenResult.error,
          ),
        );
      }

      const token = tokenResult.value;
      const expiresAt = new Date(
        Date.now() + this.defaultSessionHours * 60 * 60 * 1000,
      );

      // Create session
      const sessionResult = await this.userSessionRepository.create({
        userId,
        token,
        expiresAt,
      });

      if (sessionResult.isErr()) {
        return err(
          new SessionServiceError(
            "Failed to create session",
            sessionResult.error,
          ),
        );
      }

      return ok(sessionResult.value);
    } catch (error) {
      return err(new SessionServiceError("Failed to create session", error));
    }
  }

  async validateSession(
    token: string,
  ): Promise<Result<User | null, SessionServiceError>> {
    return this.getCurrentUser(token);
  }

  async invalidateSession(
    token: string,
  ): Promise<Result<void, SessionServiceError>> {
    try {
      const result = await this.userSessionRepository.deleteByToken(token);
      if (result.isErr()) {
        return err(
          new SessionServiceError("Failed to invalidate session", result.error),
        );
      }
      return ok(undefined);
    } catch (error) {
      return err(
        new SessionServiceError("Failed to invalidate session", error),
      );
    }
  }

  async invalidateAllUserSessions(
    userId: string,
  ): Promise<Result<void, SessionServiceError>> {
    try {
      const result = await this.userSessionRepository.deleteByUserId(userId);
      if (result.isErr()) {
        return err(
          new SessionServiceError(
            "Failed to invalidate user sessions",
            result.error,
          ),
        );
      }
      return ok(undefined);
    } catch (error) {
      return err(
        new SessionServiceError("Failed to invalidate user sessions", error),
      );
    }
  }

  async cleanupExpiredSessions(): Promise<Result<number, SessionServiceError>> {
    try {
      const result = await this.userSessionRepository.deleteExpired();
      if (result.isErr()) {
        return err(
          new SessionServiceError(
            "Failed to cleanup expired sessions",
            result.error,
          ),
        );
      }
      return ok(result.value);
    } catch (error) {
      return err(
        new SessionServiceError("Failed to cleanup expired sessions", error),
      );
    }
  }

  async extendSession(
    token: string,
    extendByHours = this.defaultSessionHours,
  ): Promise<Result<UserSession, SessionServiceError>> {
    try {
      // Find existing session
      const sessionResult = await this.userSessionRepository.findByToken(token);
      if (sessionResult.isErr()) {
        return err(
          new SessionServiceError(
            "Failed to find session",
            sessionResult.error,
          ),
        );
      }

      const session = sessionResult.value;
      if (!session) {
        return err(new SessionServiceError("Session not found"));
      }

      // Check if session is expired
      const now = new Date();
      if (session.expiresAt < now) {
        return err(new SessionServiceError("Session is expired"));
      }

      // Create new session with extended expiration
      const newExpiresAt = new Date(
        Date.now() + extendByHours * 60 * 60 * 1000,
      );

      // Delete old session and create new one
      await this.userSessionRepository.deleteByToken(token);

      const newSessionResult = await this.userSessionRepository.create({
        userId: session.userId,
        token: session.token,
        expiresAt: newExpiresAt,
      });

      if (newSessionResult.isErr()) {
        return err(
          new SessionServiceError(
            "Failed to extend session",
            newSessionResult.error,
          ),
        );
      }

      return ok(newSessionResult.value);
    } catch (error) {
      return err(new SessionServiceError("Failed to extend session", error));
    }
  }
}
