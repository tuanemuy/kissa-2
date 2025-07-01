import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { SystemSetting } from "@/core/domain/systemSettings/types";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import {
  type CreateSystemSettingInput,
  createSystemSetting,
} from "./createSystemSetting";
import {
  type UpdateSystemSettingInput,
  updateSystemSetting,
} from "./updateSystemSetting";

describe("updateSystemSetting", () => {
  let context: Context;
  let adminUser: User;
  let visitorUser: User;
  let testSetting: SystemSetting;

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

    // Create test setting
    const createInput: CreateSystemSettingInput = {
      key: "test_setting",
      value: "original value",
      description: "Original description",
      isActive: true,
    };
    const createResult = await createSystemSetting(
      context,
      adminUser.id,
      createInput,
    );
    if (createResult.isErr()) {
      throw new Error("Failed to create test setting");
    }
    testSetting = createResult.value;
  });

  it("should update system setting when user is admin", async () => {
    const input: UpdateSystemSettingInput = {
      id: testSetting.id,
      value: "updated value",
      description: "Updated description",
      isActive: false,
    };

    const result = await updateSystemSetting(context, adminUser.id, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBe(testSetting.id);
      expect(result.value.key).toBe(testSetting.key); // Key should not change
      expect(result.value.value).toBe(input.value);
      expect(result.value.description).toBe(input.description);
      expect(result.value.isActive).toBe(input.isActive);
    }
  });

  it("should update only specified fields", async () => {
    const input: UpdateSystemSettingInput = {
      id: testSetting.id,
      value: "partially updated value",
    };

    const result = await updateSystemSetting(context, adminUser.id, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.value).toBe(input.value);
      expect(result.value.description).toBe(testSetting.description); // Should remain unchanged
      expect(result.value.isActive).toBe(testSetting.isActive); // Should remain unchanged
    }
  });

  it("should fail when user is not admin", async () => {
    const input: UpdateSystemSettingInput = {
      id: testSetting.id,
      value: "updated value",
    };

    const result = await updateSystemSetting(context, visitorUser.id, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
    }
  });

  it("should fail when user does not exist", async () => {
    const input: UpdateSystemSettingInput = {
      id: testSetting.id,
      value: "updated value",
    };

    const result = await updateSystemSetting(
      context,
      "non-existent-user-id",
      input,
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
    }
  });

  it("should fail when setting does not exist", async () => {
    const input: UpdateSystemSettingInput = {
      id: "non-existent-setting-id",
      value: "updated value",
    };

    const result = await updateSystemSetting(context, adminUser.id, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ERROR_CODES.RESOURCE_NOT_FOUND);
    }
  });
});
