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
import {
  type ListSystemSettingsInput,
  listSystemSettings,
} from "./listSystemSettings";

describe("listSystemSettings", () => {
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

    // Create test settings
    const settings = [
      { key: "setting_1", value: "value 1", isActive: true },
      { key: "setting_2", value: "value 2", isActive: false },
      { key: "another_setting", value: "value 3", isActive: true },
    ];

    for (const setting of settings) {
      const createInput: CreateSystemSettingInput = setting;
      await createSystemSetting(context, adminUser.id, createInput);
    }
  });

  it("should list all system settings when user is admin", async () => {
    const input: ListSystemSettingsInput = {
      pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
    };

    const result = await listSystemSettings(context, adminUser.id, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items).toHaveLength(3);
      expect(result.value.count).toBe(3);
    }
  });

  it("should filter by key", async () => {
    const input: ListSystemSettingsInput = {
      pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
      filter: { key: "setting" },
    };

    const result = await listSystemSettings(context, adminUser.id, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items).toHaveLength(3);
      expect(result.value.count).toBe(3);
      expect(
        result.value.items.every((item) => item.key.includes("setting")),
      ).toBe(true);
    }
  });

  it("should filter by active status", async () => {
    const input: ListSystemSettingsInput = {
      pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
      filter: { isActive: true },
    };

    const result = await listSystemSettings(context, adminUser.id, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items).toHaveLength(2);
      expect(result.value.count).toBe(2);
      expect(result.value.items.every((item) => item.isActive === true)).toBe(
        true,
      );
    }
  });

  it("should handle pagination", async () => {
    const input: ListSystemSettingsInput = {
      pagination: { page: 1, limit: 2, order: "desc", orderBy: "createdAt" },
    };

    const result = await listSystemSettings(context, adminUser.id, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.items).toHaveLength(2);
      expect(result.value.count).toBe(3);
    }
  });

  it("should fail when user is not admin", async () => {
    const input: ListSystemSettingsInput = {
      pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
    };

    const result = await listSystemSettings(context, visitorUser.id, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
    }
  });

  it("should fail when user does not exist", async () => {
    const input: ListSystemSettingsInput = {
      pagination: { page: 1, limit: 10, order: "desc", orderBy: "createdAt" },
    };

    const result = await listSystemSettings(
      context,
      "non-existent-user-id",
      input,
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
    }
  });
});
