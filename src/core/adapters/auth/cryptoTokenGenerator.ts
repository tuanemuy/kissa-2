import { err, ok, type Result } from "neverthrow";
import {
  AuthServiceError,
  type TokenGenerator,
} from "@/core/domain/user/ports/authService";

export class CryptoTokenGenerator implements TokenGenerator {
  private generateRandomBytes(length: number): string {
    if (
      typeof globalThis.crypto !== "undefined" &&
      globalThis.crypto.getRandomValues
    ) {
      // Browser environment or Node.js with crypto global
      const array = new Uint8Array(length);
      globalThis.crypto.getRandomValues(array);
      return Array.from(array, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
    }
    // Node.js environment
    const crypto = require("node:crypto");
    return crypto.randomBytes(length).toString("hex");
  }

  async generateSessionToken(): Promise<Result<string, AuthServiceError>> {
    try {
      // Generate a 32-byte (256-bit) token
      const token = this.generateRandomBytes(32);
      return ok(token);
    } catch (error) {
      return err(
        new AuthServiceError("Failed to generate session token", error),
      );
    }
  }

  async generatePasswordResetToken(): Promise<
    Result<string, AuthServiceError>
  > {
    try {
      // Generate a 24-byte (192-bit) token for password reset
      const token = this.generateRandomBytes(24);
      return ok(token);
    } catch (error) {
      return err(
        new AuthServiceError("Failed to generate password reset token", error),
      );
    }
  }

  async generateEmailVerificationToken(): Promise<
    Result<string, AuthServiceError>
  > {
    try {
      // Generate a 24-byte (192-bit) token for email verification
      const token = this.generateRandomBytes(24);
      return ok(token);
    } catch (error) {
      return err(
        new AuthServiceError(
          "Failed to generate email verification token",
          error,
        ),
      );
    }
  }
}
