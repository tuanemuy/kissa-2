import { err, ok, type Result } from "neverthrow";
import {
  AuthServiceError,
  type PasswordHasher,
  type TokenGenerator,
} from "@/core/domain/user/ports/authService";

export class MockPasswordHasher implements PasswordHasher {
  private passwords = new Map<string, string>();

  async hash(password: string): Promise<Result<string, AuthServiceError>> {
    // Validate password is not empty
    if (!password || password.trim().length === 0) {
      return err(new AuthServiceError("Password cannot be empty"));
    }

    const hashedPassword = `hashed_${password}`;
    this.passwords.set(hashedPassword, password);
    return ok(hashedPassword);
  }

  async verify(
    password: string,
    hashedPassword: string,
  ): Promise<Result<boolean, AuthServiceError>> {
    const originalPassword = this.passwords.get(hashedPassword);
    return ok(originalPassword === password);
  }

  reset(): void {
    this.passwords.clear();
  }
}

export class MockTokenGenerator implements TokenGenerator {
  async generateSessionToken(): Promise<Result<string, AuthServiceError>> {
    const token = `session_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return ok(token);
  }

  async generatePasswordResetToken(): Promise<
    Result<string, AuthServiceError>
  > {
    const token = `reset_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return ok(token);
  }

  async generateEmailVerificationToken(): Promise<
    Result<string, AuthServiceError>
  > {
    const token = `verification_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return ok(token);
  }

  reset(): void {
    // No internal state to reset
  }
}
