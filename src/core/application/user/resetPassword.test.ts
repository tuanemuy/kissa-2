import { beforeEach, describe, expect, it } from "vitest";
import type { MockEmailService } from "@/core/adapters/mock/emailService";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  cleanupExpiredTokens,
  type RequestPasswordResetParams,
  type ResetPasswordParams,
  requestPasswordReset,
  resetPassword,
} from "./resetPassword";

describe("password reset functionality", () => {
  let context: Context;
  let testUser: User;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create a test user
    const hashedPassword = await context.passwordHasher.hash("oldpassword123");
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

  describe("requestPasswordReset", () => {
    describe("successful password reset request", () => {
      it("should send password reset email for existing user", async () => {
        const params: RequestPasswordResetParams = {
          email: "test@example.com",
        };

        const result = await requestPasswordReset(context, params);

        expect(result.isOk()).toBe(true);

        const emailService = context.emailService as MockEmailService;
        const sentEmails = emailService.getSentEmails();

        expect(sentEmails).toHaveLength(1);
        expect(sentEmails[0].type).toBe("passwordReset");
        expect(sentEmails[0].to).toBe(testUser.email);
        expect(sentEmails[0].name).toBe(testUser.name);
        expect(sentEmails[0].token).toBeDefined();
      });

      it("should create password reset token", async () => {
        const params: RequestPasswordResetParams = {
          email: "test@example.com",
        };

        const result = await requestPasswordReset(context, params);

        expect(result.isOk()).toBe(true);

        const emailService = context.emailService as MockEmailService;
        const lastEmail = emailService.getLastSentEmail();
        expect(lastEmail).toBeDefined();

        if (lastEmail?.token) {
          const tokenResult =
            await context.passwordResetTokenRepository.findByToken(
              lastEmail.token,
            );
          expect(tokenResult.isOk()).toBe(true);
          if (tokenResult.isOk()) {
            expect(tokenResult.value).toBeDefined();
            expect(tokenResult.value?.userId).toBe(testUser.id);
            expect(tokenResult.value?.expiresAt.getTime()).toBeGreaterThan(
              Date.now(),
            );
          }
        }
      });

      it("should return success for non-existent email (security)", async () => {
        const params: RequestPasswordResetParams = {
          email: "nonexistent@example.com",
        };

        const result = await requestPasswordReset(context, params);

        // Should return success to not reveal whether email exists
        expect(result.isOk()).toBe(true);

        const emailService = context.emailService as MockEmailService;
        const sentEmails = emailService.getSentEmails();

        // No email should be sent
        expect(sentEmails).toHaveLength(0);
      });

      it("should create token with 24-hour expiration", async () => {
        const params: RequestPasswordResetParams = {
          email: "test@example.com",
        };

        const beforeRequest = Date.now();
        const result = await requestPasswordReset(context, params);
        const afterRequest = Date.now();

        expect(result.isOk()).toBe(true);

        const emailService = context.emailService as MockEmailService;
        const lastEmail = emailService.getLastSentEmail();

        if (lastEmail?.token) {
          const tokenResult =
            await context.passwordResetTokenRepository.findByToken(
              lastEmail.token,
            );
          if (tokenResult.isOk() && tokenResult.value) {
            const expectedMinExpiry = beforeRequest + 24 * 60 * 60 * 1000;
            const expectedMaxExpiry = afterRequest + 24 * 60 * 60 * 1000;

            expect(
              tokenResult.value.expiresAt.getTime(),
            ).toBeGreaterThanOrEqual(expectedMinExpiry);
            expect(tokenResult.value.expiresAt.getTime()).toBeLessThanOrEqual(
              expectedMaxExpiry,
            );
          }
        }
      });
    });

    describe("request failures", () => {
      it("should fail when email service fails", async () => {
        context = createMockContext({ shouldFailEmail: true });

        // Re-create test user in new context
        const hashedPassword =
          await context.passwordHasher.hash("oldpassword123");
        if (hashedPassword.isOk()) {
          await context.userRepository.create({
            email: "test@example.com",
            password: hashedPassword.value,
            name: "Test User",
          });
        }

        const params: RequestPasswordResetParams = {
          email: "test@example.com",
        };

        const result = await requestPasswordReset(context, params);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.message).toBe(
            "Failed to send password reset email",
          );
        }
      });
    });
  });

  describe("resetPassword", () => {
    let resetToken: string;

    beforeEach(async () => {
      // First request a password reset to get a token
      const requestResult = await requestPasswordReset(context, {
        email: "test@example.com",
      });

      expect(requestResult.isOk()).toBe(true);

      const emailService = context.emailService as MockEmailService;
      const lastEmail = emailService.getLastSentEmail();
      expect(lastEmail?.token).toBeDefined();
      if (lastEmail?.token) {
        resetToken = lastEmail.token;
      }
    });

    describe("successful password reset", () => {
      it("should reset password with valid token", async () => {
        const params: ResetPasswordParams = {
          token: resetToken,
          newPassword: "newpassword123",
        };

        const result = await resetPassword(context, params);

        expect(result.isOk()).toBe(true);

        // Verify password was actually changed
        const userResult = await context.userRepository.findById(testUser.id);
        if (userResult.isOk() && userResult.value) {
          expect(userResult.value.hashedPassword).toBe("hashed_newpassword123");
        }
      });

      it("should mark token as used", async () => {
        const params: ResetPasswordParams = {
          token: resetToken,
          newPassword: "newpassword123",
        };

        const result = await resetPassword(context, params);

        expect(result.isOk()).toBe(true);

        const tokenResult =
          await context.passwordResetTokenRepository.findByToken(resetToken);
        if (tokenResult.isOk() && tokenResult.value) {
          expect(tokenResult.value.usedAt).toBeInstanceOf(Date);
        }
      });

      it("should invalidate all existing sessions", async () => {
        // Create a session first
        const sessionResult = await context.userSessionRepository.create({
          userId: testUser.id,
          token: "existing_session_token",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });
        expect(sessionResult.isOk()).toBe(true);

        const params: ResetPasswordParams = {
          token: resetToken,
          newPassword: "newpassword123",
        };

        const result = await resetPassword(context, params);

        expect(result.isOk()).toBe(true);

        // Check that session was deleted
        const sessionFindResult =
          await context.userSessionRepository.findByToken(
            "existing_session_token",
          );
        if (sessionFindResult.isOk()) {
          expect(sessionFindResult.value).toBeNull();
        }
      });
    });

    describe("reset failures", () => {
      it("should fail with invalid token", async () => {
        const params: ResetPasswordParams = {
          token: "invalid_token",
          newPassword: "newpassword123",
        };

        const result = await resetPassword(context, params);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.message).toBe("Invalid or expired reset token");
        }
      });

      it("should fail with expired token", async () => {
        // Create an expired token directly
        const expiredTokenResult =
          await context.passwordResetTokenRepository.create({
            userId: testUser.id,
            token: "expired_token",
            expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          });
        expect(expiredTokenResult.isOk()).toBe(true);

        const params: ResetPasswordParams = {
          token: "expired_token",
          newPassword: "newpassword123",
        };

        const result = await resetPassword(context, params);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.message).toBe("Reset token has expired");
        }
      });

      it("should fail with already used token", async () => {
        const params: ResetPasswordParams = {
          token: resetToken,
          newPassword: "newpassword123",
        };

        // Use the token once
        const firstResult = await resetPassword(context, params);
        expect(firstResult.isOk()).toBe(true);

        // Try to use the same token again
        const secondResult = await resetPassword(context, params);

        expect(secondResult.isErr()).toBe(true);
        if (secondResult.isErr()) {
          expect(secondResult.error.message).toBe(
            "Reset token has already been used",
          );
        }
      });

      it("should fail with empty new password", async () => {
        const params: ResetPasswordParams = {
          token: resetToken,
          newPassword: "",
        };

        const result = await resetPassword(context, params);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.message).toBe("Failed to hash new password");
        }
      });
    });

    describe("edge cases", () => {
      it("should handle very long new password", async () => {
        const params: ResetPasswordParams = {
          token: resetToken,
          newPassword: "a".repeat(1000),
        };

        const result = await resetPassword(context, params);

        expect(result.isOk()).toBe(true);
      });

      it("should handle unicode characters in new password", async () => {
        const params: ResetPasswordParams = {
          token: resetToken,
          newPassword: "パスワード123!@#",
        };

        const result = await resetPassword(context, params);

        expect(result.isOk()).toBe(true);
      });

      it("should handle special characters in new password", async () => {
        const params: ResetPasswordParams = {
          token: resetToken,
          newPassword: "!@#$%^&*()_+-=[]{}|;:,.<>?",
        };

        const result = await resetPassword(context, params);

        expect(result.isOk()).toBe(true);
      });
    });
  });

  describe("cleanupExpiredTokens", () => {
    it("should clean up expired tokens", async () => {
      // Create some expired tokens
      await context.passwordResetTokenRepository.create({
        userId: testUser.id,
        token: "expired_token_1",
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      });

      await context.passwordResetTokenRepository.create({
        userId: testUser.id,
        token: "expired_token_2",
        expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      });

      // Create a valid token
      await context.passwordResetTokenRepository.create({
        userId: testUser.id,
        token: "valid_token",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      });

      const result = await cleanupExpiredTokens(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(2); // Should have deleted 2 expired tokens
      }

      // Verify expired tokens are gone
      const expiredToken1Result =
        await context.passwordResetTokenRepository.findByToken(
          "expired_token_1",
        );
      const expiredToken2Result =
        await context.passwordResetTokenRepository.findByToken(
          "expired_token_2",
        );
      const validTokenResult =
        await context.passwordResetTokenRepository.findByToken("valid_token");

      if (expiredToken1Result.isOk()) {
        expect(expiredToken1Result.value).toBeNull();
      }
      if (expiredToken2Result.isOk()) {
        expect(expiredToken2Result.value).toBeNull();
      }
      if (validTokenResult.isOk()) {
        expect(validTokenResult.value).toBeDefined();
      }
    });

    it("should return 0 when no expired tokens exist", async () => {
      const result = await cleanupExpiredTokens(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(0);
      }
    });
  });

  describe("security considerations", () => {
    it("should not allow reuse of reset tokens", async () => {
      const requestResult = await requestPasswordReset(context, {
        email: "test@example.com",
      });
      expect(requestResult.isOk()).toBe(true);

      const emailService = context.emailService as MockEmailService;
      const lastEmail = emailService.getLastSentEmail();
      const token = lastEmail?.token;
      if (!token) {
        throw new Error("Token not found in test");
      }

      // First reset
      const firstReset = await resetPassword(context, {
        token,
        newPassword: "newpassword1",
      });
      expect(firstReset.isOk()).toBe(true);

      // Second reset with same token should fail
      const secondReset = await resetPassword(context, {
        token,
        newPassword: "newpassword2",
      });
      expect(secondReset.isErr()).toBe(true);
    });

    it("should handle multiple password reset requests", async () => {
      // Request first reset
      const firstRequest = await requestPasswordReset(context, {
        email: "test@example.com",
      });
      expect(firstRequest.isOk()).toBe(true);

      // Request second reset
      const secondRequest = await requestPasswordReset(context, {
        email: "test@example.com",
      });
      expect(secondRequest.isOk()).toBe(true);

      const emailService = context.emailService as MockEmailService;
      const sentEmails = emailService.getSentEmails();

      expect(sentEmails).toHaveLength(2);

      // Both tokens should be valid
      const token1 = sentEmails[0].token;
      const token2 = sentEmails[1].token;
      if (!token1 || !token2) {
        throw new Error("Tokens not found in test");
      }

      const token1Result =
        await context.passwordResetTokenRepository.findByToken(token1);
      const token2Result =
        await context.passwordResetTokenRepository.findByToken(token2);

      expect(token1Result.isOk()).toBe(true);
      expect(token2Result.isOk()).toBe(true);
      if (token1Result.isOk()) {
        expect(token1Result.value).toBeDefined();
      }
      if (token2Result.isOk()) {
        expect(token2Result.value).toBeDefined();
      }
    });
  });
});
