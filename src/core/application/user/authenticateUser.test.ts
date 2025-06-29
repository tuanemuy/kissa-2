import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import {
  type AuthenticateUserInput,
  authenticateUser,
} from "./authenticateUser";

describe("authenticateUser", () => {
  let context: Context;
  let testUser: User;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create a test user
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    const userResult = await context.userRepository.create({
      email: "test@example.com",
      password: hashedPassword.value,
      name: "Test User",
    });

    if (userResult.isErr()) {
      throw new Error("Failed to create test user");
    }

    testUser = userResult.value;
  });

  describe("successful authentication", () => {
    it("should authenticate user with valid credentials", async () => {
      const input: AuthenticateUserInput = {
        email: "test@example.com",
        password: "password123",
      };

      const result = await authenticateUser(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.user.id).toBe(testUser.id);
        expect(result.value.user.email).toBe(testUser.email);
        expect(result.value.token).toBeDefined();
        expect(result.value.expiresAt).toBeInstanceOf(Date);
        expect(result.value.expiresAt.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it("should update last login time", async () => {
      const input: AuthenticateUserInput = {
        email: "test@example.com",
        password: "password123",
      };

      const result = await authenticateUser(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.user.lastLoginAt).toBeInstanceOf(Date);
        expect(result.value.user.lastLoginAt?.getTime()).toBeGreaterThan(
          testUser.lastLoginAt?.getTime() || 0,
        );
      }
    });

    it("should create a session", async () => {
      const input: AuthenticateUserInput = {
        email: "test@example.com",
        password: "password123",
      };

      const result = await authenticateUser(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const sessionResult = await context.userSessionRepository.findByToken(
          result.value.token,
        );
        expect(sessionResult.isOk()).toBe(true);
        if (sessionResult.isOk()) {
          expect(sessionResult.value).toBeDefined();
          expect(sessionResult.value?.userId).toBe(testUser.id);
        }
      }
    });
  });

  describe("authentication failures", () => {
    it("should fail with non-existent email", async () => {
      const input: AuthenticateUserInput = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const result = await authenticateUser(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
      }
    });

    it("should fail with incorrect password", async () => {
      const input: AuthenticateUserInput = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const result = await authenticateUser(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
      }
    });

    it("should fail with inactive user", async () => {
      // Update user status to suspended
      await context.userRepository.updateStatus(testUser.id, "suspended");

      const input: AuthenticateUserInput = {
        email: "test@example.com",
        password: "password123",
      };

      const result = await authenticateUser(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });

    it("should fail with deleted user", async () => {
      // Update user status to deleted
      await context.userRepository.updateStatus(testUser.id, "deleted");

      const input: AuthenticateUserInput = {
        email: "test@example.com",
        password: "password123",
      };

      const result = await authenticateUser(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty email", async () => {
      const input: AuthenticateUserInput = {
        email: "",
        password: "password123",
      };

      const result = await authenticateUser(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
      }
    });

    it("should handle empty password", async () => {
      const input: AuthenticateUserInput = {
        email: "test@example.com",
        password: "",
      };

      const result = await authenticateUser(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
      }
    });

    it("should handle very long email", async () => {
      const longEmail = `${"a".repeat(250)}@example.com`;
      const input: AuthenticateUserInput = {
        email: longEmail,
        password: "password123",
      };

      const result = await authenticateUser(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
      }
    });

    it("should handle very long password", async () => {
      const longPassword = "a".repeat(1000);
      const input: AuthenticateUserInput = {
        email: "test@example.com",
        password: longPassword,
      };

      const result = await authenticateUser(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
      }
    });

    it("should handle case sensitivity in email", async () => {
      const input: AuthenticateUserInput = {
        email: "TEST@EXAMPLE.COM",
        password: "password123",
      };

      const result = await authenticateUser(context, input);

      // Should fail because emails are case-sensitive in our implementation
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
      }
    });
  });

  describe("session expiration", () => {
    it("should create session with 7-day expiration", async () => {
      const input: AuthenticateUserInput = {
        email: "test@example.com",
        password: "password123",
      };

      const beforeAuth = Date.now();
      const result = await authenticateUser(context, input);
      const afterAuth = Date.now();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const expectedMinExpiry = beforeAuth + 7 * 24 * 60 * 60 * 1000;
        const expectedMaxExpiry = afterAuth + 7 * 24 * 60 * 60 * 1000;

        expect(result.value.expiresAt.getTime()).toBeGreaterThanOrEqual(
          expectedMinExpiry,
        );
        expect(result.value.expiresAt.getTime()).toBeLessThanOrEqual(
          expectedMaxExpiry,
        );
      }
    });
  });
});
