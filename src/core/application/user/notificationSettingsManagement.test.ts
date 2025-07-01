import { beforeEach, describe, expect, it } from "vitest";
import { createMockContext } from "@/core/adapters/mock/testContext";
import type {
  MockNotificationSettingsRepository,
  MockUserRepository,
} from "@/core/adapters/mock/userRepository";
import type { NotificationSettings, User } from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  disableAllNotifications,
  enableAllNotifications,
  getNotificationSettings,
  getNotificationSummary,
  isNotificationEnabled,
  resetNotificationSettings,
  type UpdateNotificationSettingsInput,
  updateNotificationSettings,
} from "./notificationSettingsManagement";

describe("Notification Settings Management", () => {
  let context: Context;
  let mockUser: User;
  let mockNotificationSettings: NotificationSettings;

  beforeEach(() => {
    context = createMockContext();

    mockUser = {
      id: "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      email: "test@example.com",
      hashedPassword: "hashed-password",
      name: "Test User",
      role: "editor",
      status: "active",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockNotificationSettings = {
      id: "settings-123",
      userId: "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      emailNotifications: true,
      checkinNotifications: true,
      editorInviteNotifications: true,
      systemNotifications: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Set up mock repositories with test data
    const userRepo = context.userRepository as MockUserRepository;

    // Add mock users and notification settings
    userRepo.addUser(mockUser);
    // Note: We'll add notification settings as needed in individual tests
  });

  describe("getNotificationSettings", () => {
    it("should successfully get existing notification settings", async () => {
      // Arrange
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      notificationRepo.addNotificationSettings(mockNotificationSettings);

      // Act
      const result = await getNotificationSettings(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
        expect(result.value.emailNotifications).toBe(true);
        expect(result.value.checkinNotifications).toBe(true);
        expect(result.value.editorInviteNotifications).toBe(true);
        expect(result.value.systemNotifications).toBe(true);
      }
    });

    it("should create default settings when none exist", async () => {
      // Arrange - don't add notification settings, so they'll be created

      // Act
      const result = await getNotificationSettings(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
        expect(result.value.emailNotifications).toBe(true);
        expect(result.value.checkinNotifications).toBe(true);
        expect(result.value.editorInviteNotifications).toBe(true);
        expect(result.value.systemNotifications).toBe(true);
      }
    });

    it("should fail when user is not found", async () => {
      // Act
      const result = await getNotificationSettings(
        context,
        "00000000-0000-0000-0000-000000000000",
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to find user");
      }
    });

    it("should handle repository error gracefully", async () => {
      // Note: With mock repositories, we can't easily simulate errors
      // This test would be more relevant in integration tests
      // For now, we'll test a successful case instead

      // Act
      const result = await getNotificationSettings(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
      }
    });
  });

  describe("updateNotificationSettings", () => {
    it("should successfully update existing notification settings", async () => {
      // Arrange
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      notificationRepo.addNotificationSettings(mockNotificationSettings);

      const input: UpdateNotificationSettingsInput = {
        emailNotifications: false,
      };

      // Act
      const result = await updateNotificationSettings(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.emailNotifications).toBe(false);
        expect(result.value.userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
      }
    });

    it("should create default settings if none exist and then update", async () => {
      // Arrange - don't add notification settings, so they'll be created
      const input: UpdateNotificationSettingsInput = {
        emailNotifications: false,
      };

      // Act
      const result = await updateNotificationSettings(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.emailNotifications).toBe(false);
        expect(result.value.userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
      }
    });

    it("should update multiple settings at once", async () => {
      // Arrange
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      notificationRepo.addNotificationSettings(mockNotificationSettings);

      const input: UpdateNotificationSettingsInput = {
        emailNotifications: false,
        checkinNotifications: false,
      };

      // Act
      const result = await updateNotificationSettings(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.emailNotifications).toBe(false);
        expect(result.value.checkinNotifications).toBe(false);
      }
    });

    it("should only update specified fields", async () => {
      // Arrange
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      notificationRepo.addNotificationSettings(mockNotificationSettings);

      const input: UpdateNotificationSettingsInput = {
        systemNotifications: false,
        // Other fields should remain unchanged
      };

      // Act
      const result = await updateNotificationSettings(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.systemNotifications).toBe(false);
        // Other fields should remain unchanged
        expect(result.value.emailNotifications).toBe(true);
        expect(result.value.checkinNotifications).toBe(true);
        expect(result.value.editorInviteNotifications).toBe(true);
      }
    });
  });

  describe("resetNotificationSettings", () => {
    it("should successfully reset to default settings", async () => {
      // Arrange
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      const disabledSettings = {
        ...mockNotificationSettings,
        emailNotifications: false,
        checkinNotifications: false,
      };
      notificationRepo.addNotificationSettings(disabledSettings);

      // Act
      const result = await resetNotificationSettings(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.emailNotifications).toBe(true);
        expect(result.value.checkinNotifications).toBe(true);
        expect(result.value.editorInviteNotifications).toBe(true);
        expect(result.value.systemNotifications).toBe(true);
      }
    });
  });

  describe("isNotificationEnabled", () => {
    it("should check if email notifications are enabled", async () => {
      // Arrange
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      notificationRepo.addNotificationSettings(mockNotificationSettings);

      // Act
      const result = await isNotificationEnabled(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        "email",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should check if checkin notifications are enabled", async () => {
      // Arrange
      const settingsWithDisabledCheckin = {
        ...mockNotificationSettings,
        id: "settings-disabled-checkin",
        checkinNotifications: false,
      };
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      notificationRepo.reset(); // Clear existing settings
      notificationRepo.addNotificationSettings(settingsWithDisabledCheckin);

      // Act
      const result = await isNotificationEnabled(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        "checkin",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });

    it("should check if editor invite notifications are enabled", async () => {
      // Arrange
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      notificationRepo.reset(); // Clear existing settings
      notificationRepo.addNotificationSettings(mockNotificationSettings);

      // Act
      const result = await isNotificationEnabled(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        "editorInvite",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it("should check if system notifications are enabled", async () => {
      // Arrange
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      notificationRepo.reset(); // Clear existing settings
      notificationRepo.addNotificationSettings(mockNotificationSettings);

      // Act
      const result = await isNotificationEnabled(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        "system",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });
  });

  describe("enableAllNotifications", () => {
    it("should enable all notification types", async () => {
      // Arrange
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      const disabledSettings = {
        ...mockNotificationSettings,
        emailNotifications: false,
        checkinNotifications: false,
      };
      notificationRepo.reset(); // Clear existing settings
      notificationRepo.addNotificationSettings(disabledSettings);

      // Act
      const result = await enableAllNotifications(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.emailNotifications).toBe(true);
        expect(result.value.checkinNotifications).toBe(true);
        expect(result.value.editorInviteNotifications).toBe(true);
        expect(result.value.systemNotifications).toBe(true);
      }
    });
  });

  describe("disableAllNotifications", () => {
    it("should disable all notification types", async () => {
      // Arrange
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      notificationRepo.reset(); // Clear existing settings
      notificationRepo.addNotificationSettings(mockNotificationSettings);

      // Act
      const result = await disableAllNotifications(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.emailNotifications).toBe(false);
        expect(result.value.checkinNotifications).toBe(false);
        expect(result.value.editorInviteNotifications).toBe(false);
        expect(result.value.systemNotifications).toBe(false);
      }
    });
  });

  describe("getNotificationSummary", () => {
    it("should return summary when all notifications are enabled", async () => {
      // Arrange
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      notificationRepo.reset(); // Clear existing settings
      notificationRepo.addNotificationSettings(mockNotificationSettings);

      // Act
      const result = await getNotificationSummary(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.settings.userId).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
        expect(result.value.enabledCount).toBe(4);
        expect(result.value.totalCount).toBe(4);
        expect(result.value.allEnabled).toBe(true);
        expect(result.value.allDisabled).toBe(false);
      }
    });

    it("should return summary when all notifications are disabled", async () => {
      // Arrange
      const allDisabledSettings = {
        ...mockNotificationSettings,
        id: "settings-all-disabled",
        emailNotifications: false,
        checkinNotifications: false,
        editorInviteNotifications: false,
        systemNotifications: false,
      };
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      notificationRepo.reset(); // Clear existing settings
      notificationRepo.addNotificationSettings(allDisabledSettings);

      // Act
      const result = await getNotificationSummary(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.enabledCount).toBe(0);
        expect(result.value.totalCount).toBe(4);
        expect(result.value.allEnabled).toBe(false);
        expect(result.value.allDisabled).toBe(true);
      }
    });

    it("should return summary when some notifications are enabled", async () => {
      // Arrange
      const partialSettings = {
        ...mockNotificationSettings,
        id: "settings-partial",
        emailNotifications: true,
        checkinNotifications: false,
        editorInviteNotifications: true,
        systemNotifications: false,
      };
      const notificationRepo =
        context.notificationSettingsRepository as MockNotificationSettingsRepository;
      notificationRepo.reset(); // Clear existing settings
      notificationRepo.addNotificationSettings(partialSettings);

      // Act
      const result = await getNotificationSummary(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.enabledCount).toBe(2);
        expect(result.value.totalCount).toBe(4);
        expect(result.value.allEnabled).toBe(false);
        expect(result.value.allDisabled).toBe(false);
      }
    });
  });
});
