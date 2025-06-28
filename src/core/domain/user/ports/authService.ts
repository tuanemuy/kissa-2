import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import type { LoginCredentials, User } from "../types";

export class AuthServiceError extends AnyError {
  override readonly name = "AuthServiceError";

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export interface PasswordHasher {
  hash(password: string): Promise<Result<string, AuthServiceError>>;

  verify(
    password: string,
    hashedPassword: string,
  ): Promise<Result<boolean, AuthServiceError>>;
}

export interface TokenGenerator {
  generateSessionToken(): Promise<Result<string, AuthServiceError>>;

  generatePasswordResetToken(): Promise<Result<string, AuthServiceError>>;

  generateEmailVerificationToken(): Promise<Result<string, AuthServiceError>>;
}

export interface AuthService {
  authenticateUser(
    credentials: LoginCredentials,
  ): Promise<Result<User, AuthServiceError>>;

  createUserSession(
    userId: string,
  ): Promise<Result<{ token: string; expiresAt: Date }, AuthServiceError>>;

  validateSession(
    token: string,
  ): Promise<Result<User | null, AuthServiceError>>;

  invalidateSession(token: string): Promise<Result<void, AuthServiceError>>;

  invalidateAllUserSessions(
    userId: string,
  ): Promise<Result<void, AuthServiceError>>;
}
