import { ok } from "neverthrow";
import { describe, expect, it } from "vitest";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  type ChangePasswordInput,
  changeUserPassword,
  getUserProfile,
  type UpdateUserProfileInput,
  UserProfileManagementError,
  updateUserProfile,
} from "./userProfileManagement";

const mockUser: User = {
  id: "12345678-1234-1234-1234-123456789012",
  email: "test@example.com",
  hashedPassword: "hashed-password",
  name: "Test User",
  role: "visitor",
  status: "active",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: undefined,
  bio: undefined,
  avatar: undefined,
};

const createMockContext = (
  userResult: any = ok(mockUser as User | null),
  updateResult = ok(mockUser),
  passwordVerifyResult = ok(true),
  hashResult = ok("new-hashed-password"),
  updatePasswordResult = ok(undefined),
): Context =>
  ({
    userRepository: {
      findById: () => Promise.resolve(userResult),
      updateProfile: () => Promise.resolve(updateResult),
      updatePassword: () => Promise.resolve(updatePasswordResult),
    },
    passwordHasher: {
      verify: () => Promise.resolve(passwordVerifyResult),
      hash: () => Promise.resolve(hashResult),
    },
  }) as unknown as Context;

describe("getUserProfile", () => {
  it("should return user profile successfully", async () => {
    const context = createMockContext();

    const result = await getUserProfile(
      context,
      "12345678-1234-1234-1234-123456789012",
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockUser);
    }
  });

  it("should return error for invalid UUID", async () => {
    const context = createMockContext();

    const result = await getUserProfile(context, "invalid-uuid");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(UserProfileManagementError);
      expect(result.error.message).toBe("Invalid UUID format");
    }
  });

  it("should return error when user not found", async () => {
    const context = createMockContext(ok(null));

    const result = await getUserProfile(
      context,
      "12345678-1234-1234-1234-123456789012",
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(UserProfileManagementError);
      expect(result.error.message).toBe("User not found");
    }
  });
});

describe("updateUserProfile", () => {
  it("should update user profile successfully", async () => {
    const updatedUser = { ...mockUser, name: "Updated Name" };
    const context = createMockContext(ok(mockUser), ok(updatedUser));
    const input: UpdateUserProfileInput = {
      name: "Updated Name",
    };

    const result = await updateUserProfile(
      context,
      "12345678-1234-1234-1234-123456789012",
      input,
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.name).toBe("Updated Name");
    }
  });

  it("should return error for invalid UUID", async () => {
    const context = createMockContext();
    const input: UpdateUserProfileInput = {
      name: "Updated Name",
    };

    const result = await updateUserProfile(context, "invalid-uuid", input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(UserProfileManagementError);
      expect(result.error.message).toBe("Invalid UUID format");
    }
  });

  it("should return error when user not found", async () => {
    const context = createMockContext(ok(null));
    const input: UpdateUserProfileInput = {
      name: "Updated Name",
    };

    const result = await updateUserProfile(
      context,
      "12345678-1234-1234-1234-123456789012",
      input,
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(UserProfileManagementError);
      expect(result.error.message).toBe("User not found");
    }
  });
});

describe("changeUserPassword", () => {
  it("should change password successfully", async () => {
    const context = createMockContext();
    const input: ChangePasswordInput = {
      currentPassword: "current-password",
      newPassword: "new-password",
    };

    const result = await changeUserPassword(
      context,
      "12345678-1234-1234-1234-123456789012",
      input,
    );

    expect(result.isOk()).toBe(true);
  });

  it("should return error for invalid UUID", async () => {
    const context = createMockContext();
    const input: ChangePasswordInput = {
      currentPassword: "current-password",
      newPassword: "new-password",
    };

    const result = await changeUserPassword(context, "invalid-uuid", input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(UserProfileManagementError);
      expect(result.error.message).toBe("Invalid UUID format");
    }
  });

  it("should return error when current password is incorrect", async () => {
    const context = createMockContext(
      ok(mockUser),
      ok(mockUser),
      ok(false), // password verification fails
    );
    const input: ChangePasswordInput = {
      currentPassword: "wrong-password",
      newPassword: "new-password",
    };

    const result = await changeUserPassword(
      context,
      "12345678-1234-1234-1234-123456789012",
      input,
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(UserProfileManagementError);
      expect(result.error.message).toBe("Current password is incorrect");
    }
  });
});
