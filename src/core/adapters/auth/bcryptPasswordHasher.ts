import { err, ok, type Result } from "neverthrow";
import {
  AuthServiceError,
  type PasswordHasher,
} from "@/core/domain/user/ports/authService";

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds: number;

  constructor(saltRounds = 12) {
    this.saltRounds = saltRounds;
  }

  async hash(password: string): Promise<Result<string, AuthServiceError>> {
    try {
      // Import bcrypt dynamically to handle both browser and server environments
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      return ok(hashedPassword);
    } catch (error) {
      return err(new AuthServiceError("Failed to hash password", error));
    }
  }

  async verify(
    password: string,
    hashedPassword: string,
  ): Promise<Result<boolean, AuthServiceError>> {
    try {
      // Import bcrypt dynamically to handle both browser and server environments
      const bcrypt = await import("bcryptjs");
      const isValid = await bcrypt.compare(password, hashedPassword);
      return ok(isValid);
    } catch (error) {
      return err(new AuthServiceError("Failed to verify password", error));
    }
  }
}
