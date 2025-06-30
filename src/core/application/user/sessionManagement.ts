import { err, ok, type Result } from "neverthrow";
import { cache } from "react";
import type { User, UserSession } from "@/core/domain/user/types";
import type { ApplicationContext } from "../context";
import { ApplicationServiceError } from "../error";

export class SessionManagementError extends ApplicationServiceError {
  constructor(message: string, cause?: unknown) {
    super("SessionManagement", message, cause);
  }
}

/**
 * Get the current authenticated user from session token
 * This function is cached to avoid multiple service calls during a single request
 */
export const getCurrentUser = cache(
  async (
    context: ApplicationContext,
    token: string,
  ): Promise<Result<User | null, SessionManagementError>> => {
    try {
      const result = await context.sessionService.getCurrentUser(token);

      if (result.isErr()) {
        return err(
          new SessionManagementError(
            "Failed to get current user",
            result.error,
          ),
        );
      }

      return ok(result.value);
    } catch (error) {
      return err(
        new SessionManagementError("Failed to get current user", error),
      );
    }
  },
);

/**
 * Create a new session for a user
 */
export async function createUserSession(
  context: ApplicationContext,
  userId: string,
): Promise<Result<UserSession, SessionManagementError>> {
  try {
    const result = await context.sessionService.createSession(userId);

    if (result.isErr()) {
      return err(
        new SessionManagementError(
          "Failed to create user session",
          result.error,
        ),
      );
    }

    return ok(result.value);
  } catch (error) {
    return err(
      new SessionManagementError("Failed to create user session", error),
    );
  }
}

/**
 * Validate a session token and return the associated user
 */
export async function validateUserSession(
  context: ApplicationContext,
  token: string,
): Promise<Result<User | null, SessionManagementError>> {
  try {
    const result = await context.sessionService.validateSession(token);

    if (result.isErr()) {
      return err(
        new SessionManagementError("Failed to validate session", result.error),
      );
    }

    return ok(result.value);
  } catch (error) {
    return err(new SessionManagementError("Failed to validate session", error));
  }
}

/**
 * Invalidate a specific session
 */
export async function invalidateUserSession(
  context: ApplicationContext,
  token: string,
): Promise<Result<void, SessionManagementError>> {
  try {
    const result = await context.sessionService.invalidateSession(token);

    if (result.isErr()) {
      return err(
        new SessionManagementError(
          "Failed to invalidate session",
          result.error,
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      new SessionManagementError("Failed to invalidate session", error),
    );
  }
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(
  context: ApplicationContext,
  userId: string,
): Promise<Result<void, SessionManagementError>> {
  try {
    const result =
      await context.sessionService.invalidateAllUserSessions(userId);

    if (result.isErr()) {
      return err(
        new SessionManagementError(
          "Failed to invalidate all user sessions",
          result.error,
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      new SessionManagementError(
        "Failed to invalidate all user sessions",
        error,
      ),
    );
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(
  context: ApplicationContext,
): Promise<Result<number, SessionManagementError>> {
  try {
    const result = await context.sessionService.cleanupExpiredSessions();

    if (result.isErr()) {
      return err(
        new SessionManagementError(
          "Failed to cleanup expired sessions",
          result.error,
        ),
      );
    }

    return ok(result.value);
  } catch (error) {
    return err(
      new SessionManagementError("Failed to cleanup expired sessions", error),
    );
  }
}

/**
 * Extend session expiration
 */
export async function extendUserSession(
  context: ApplicationContext,
  token: string,
  extendByHours?: number,
): Promise<Result<UserSession, SessionManagementError>> {
  try {
    const result = await context.sessionService.extendSession(
      token,
      extendByHours,
    );

    if (result.isErr()) {
      return err(
        new SessionManagementError("Failed to extend session", result.error),
      );
    }

    return ok(result.value);
  } catch (error) {
    return err(new SessionManagementError("Failed to extend session", error));
  }
}
