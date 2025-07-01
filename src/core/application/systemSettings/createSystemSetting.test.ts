import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import {
  type CreateSystemSettingInput,
  createSystemSetting,
} from "./createSystemSetting";

describe("createSystemSetting", () => {
  let context: Context;
  let adminUser: User;
  let visitorUser: User;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users with different roles
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    // Create admin user
    const adminResult = await context.userRepository.create({
      email: "admin@example.com",
      password: hashedPassword.value,
      name: "Admin User",
    });
    if (adminResult.isErr()) {
      throw new Error("Failed to create admin user");
    }
    adminUser = adminResult.value;
    await context.userRepository.updateRole(adminUser.id, "admin");

    // Create visitor user
    const visitorResult = await context.userRepository.create({
      email: "visitor@example.com",
      password: hashedPassword.value,
      name: "Visitor User",
    });
    if (visitorResult.isErr()) {
      throw new Error("Failed to create visitor user");
    }
    visitorUser = visitorResult.value;
  });

  it("should create system setting when user is admin", async () => {
    const input: CreateSystemSettingInput = {
      key: "test_setting",
      value: "test value",
      description: "Test setting description",
      isActive: true,
    };

    const result = await createSystemSetting(context, adminUser.id, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.key).toBe(input.key);
      expect(result.value.value).toBe(input.value);
      expect(result.value.description).toBe(input.description);
      expect(result.value.isActive).toBe(input.isActive);
    }
  });

  it("should fail when user is not admin", async () => {
    const input: CreateSystemSettingInput = {
      key: "test_setting",
      value: "test value",
      description: "Test setting description",
      isActive: true,
    };

    const result = await createSystemSetting(context, visitorUser.id, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
    }
  });

  it("should fail when user does not exist", async () => {
    const input: CreateSystemSettingInput = {
      key: "test_setting",
      value: "test value",
      description: "Test setting description",
      isActive: true,
    };

    const result = await createSystemSetting(
      context,
      "non-existent-user-id",
      input,
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
    }
  });

  it("should fail when setting with same key already exists", async () => {
    const input: CreateSystemSettingInput = {
      key: "duplicate_setting",
      value: "test value",
      description: "Test setting description",
      isActive: true,
    };

    // Create first setting
    const firstResult = await createSystemSetting(context, adminUser.id, input);
    expect(firstResult.isOk()).toBe(true);

    // Try to create duplicate setting
    const duplicateResult = await createSystemSetting(
      context,
      adminUser.id,
      input,
    );
    expect(duplicateResult.isErr()).toBe(true);
    if (duplicateResult.isErr()) {
      expect(duplicateResult.error.code).toBe(ERROR_CODES.DUPLICATE_RESOURCE);
    }
  });

  it("should create setting with minimal data", async () => {
    const input: CreateSystemSettingInput = {
      key: "minimal_setting",
      value: "minimal value",
      isActive: true,
    };

    const result = await createSystemSetting(context, adminUser.id, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.key).toBe(input.key);
      expect(result.value.value).toBe(input.value);
      expect(result.value.description).toBeUndefined();
      expect(result.value.isActive).toBe(true); // Default value
    }
  });
});
