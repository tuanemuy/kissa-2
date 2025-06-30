import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import type { User, UserSession } from "../types";

export class SessionServiceError extends AnyError {
  override readonly name = "SessionServiceError";

  constructor(message: string, cause?: unknown) {
    super(message, undefined, cause);
  }
}

/**
 * Port interface for session management
 * Handles user session creation, validation, and cleanup
 */
export interface SessionService {
  /**
   * Get current authenticated user from session token
   */
  getCurrentUser(
    token: string,
  ): Promise<Result<User | null, SessionServiceError>>;

  /**
   * Create a new session for a user
   */
  createSession(
    userId: string,
  ): Promise<Result<UserSession, SessionServiceError>>;

  /**
   * Validate a session token and return the associated user
   */
  validateSession(
    token: string,
  ): Promise<Result<User | null, SessionServiceError>>;

  /**
   * Invalidate a specific session
   */
  invalidateSession(token: string): Promise<Result<void, SessionServiceError>>;

  /**
   * Invalidate all sessions for a user
   */
  invalidateAllUserSessions(
    userId: string,
  ): Promise<Result<void, SessionServiceError>>;

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): Promise<Result<number, SessionServiceError>>;

  /**
   * Extend session expiration
   */
  extendSession(
    token: string,
    extendByHours?: number,
  ): Promise<Result<UserSession, SessionServiceError>>;
}
