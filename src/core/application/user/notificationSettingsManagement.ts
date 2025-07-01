import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { NotificationSettings } from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class NotificationSettingsManagementError extends AnyError {
  override readonly name = "NotificationSettingsManagementError";
}

export const updateNotificationSettingsInputSchema = z.object({
  emailNotifications: z.boolean().optional(),
  checkinNotifications: z.boolean().optional(),
  editorInviteNotifications: z.boolean().optional(),
  systemNotifications: z.boolean().optional(),
});
export type UpdateNotificationSettingsInput = z.infer<
  typeof updateNotificationSettingsInputSchema
>;

/**
 * Get notification settings for a user
 */
export async function getNotificationSettings(
  context: Context,
  userId: string,
): Promise<Result<NotificationSettings, NotificationSettingsManagementError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new NotificationSettingsManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new NotificationSettingsManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Get existing settings
    const settingsResult =
      await context.notificationSettingsRepository.findByUserId(userId);
    if (settingsResult.isErr()) {
      return err(
        new NotificationSettingsManagementError(
          "Failed to get notification settings",
          ERROR_CODES.INTERNAL_ERROR,
          settingsResult.error,
        ),
      );
    }

    const settings = settingsResult.value;
    if (settings) {
      return ok(settings);
    }

    // Create default settings if none exist
    const defaultSettings: Omit<
      NotificationSettings,
      "id" | "createdAt" | "updatedAt"
    > = {
      userId,
      emailNotifications: true,
      checkinNotifications: true,
      editorInviteNotifications: true,
      systemNotifications: true,
    };

    const createResult =
      await context.notificationSettingsRepository.create(defaultSettings);
    if (createResult.isErr()) {
      return err(
        new NotificationSettingsManagementError(
          "Failed to create default notification settings",
          ERROR_CODES.INTERNAL_ERROR,
          createResult.error,
        ),
      );
    }

    return ok(createResult.value);
  } catch (error) {
    return err(
      new NotificationSettingsManagementError(
        "Unexpected error getting notification settings",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Update notification settings for a user
 */
export async function updateNotificationSettings(
  context: Context,
  userId: string,
  input: UpdateNotificationSettingsInput,
): Promise<Result<NotificationSettings, NotificationSettingsManagementError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new NotificationSettingsManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new NotificationSettingsManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Get existing settings
    const settingsResult =
      await context.notificationSettingsRepository.findByUserId(userId);
    if (settingsResult.isErr()) {
      return err(
        new NotificationSettingsManagementError(
          "Failed to find notification settings",
          ERROR_CODES.INTERNAL_ERROR,
          settingsResult.error,
        ),
      );
    }

    let settings = settingsResult.value;

    // Create default settings if none exist
    if (!settings) {
      const defaultSettings: Omit<
        NotificationSettings,
        "id" | "createdAt" | "updatedAt"
      > = {
        userId,
        emailNotifications: true,
        checkinNotifications: true,
        editorInviteNotifications: true,
        systemNotifications: true,
      };

      const createResult =
        await context.notificationSettingsRepository.create(defaultSettings);
      if (createResult.isErr()) {
        return err(
          new NotificationSettingsManagementError(
            "Failed to create notification settings",
            ERROR_CODES.INTERNAL_ERROR,
            createResult.error,
          ),
        );
      }
      settings = createResult.value;
    }

    // Update settings
    const updateParams: Partial<
      Pick<
        NotificationSettings,
        | "emailNotifications"
        | "checkinNotifications"
        | "editorInviteNotifications"
        | "systemNotifications"
      >
    > = {};

    if (input.emailNotifications !== undefined) {
      updateParams.emailNotifications = input.emailNotifications;
    }
    if (input.checkinNotifications !== undefined) {
      updateParams.checkinNotifications = input.checkinNotifications;
    }
    if (input.editorInviteNotifications !== undefined) {
      updateParams.editorInviteNotifications = input.editorInviteNotifications;
    }
    if (input.systemNotifications !== undefined) {
      updateParams.systemNotifications = input.systemNotifications;
    }

    const updateResult = await context.notificationSettingsRepository.update(
      settings.id,
      updateParams,
    );
    if (updateResult.isErr()) {
      return err(
        new NotificationSettingsManagementError(
          "Failed to update notification settings",
          ERROR_CODES.INTERNAL_ERROR,
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new NotificationSettingsManagementError(
        "Unexpected error updating notification settings",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Reset notification settings to defaults for a user
 */
export async function resetNotificationSettings(
  context: Context,
  userId: string,
): Promise<Result<NotificationSettings, NotificationSettingsManagementError>> {
  try {
    // Verify user exists
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new NotificationSettingsManagementError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new NotificationSettingsManagementError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    // Reset to default values
    const defaultSettings: UpdateNotificationSettingsInput = {
      emailNotifications: true,
      checkinNotifications: true,
      editorInviteNotifications: true,
      systemNotifications: true,
    };

    const result = await updateNotificationSettings(
      context,
      userId,
      defaultSettings,
    );
    if (result.isErr()) {
      return err(result.error);
    }

    return ok(result.value);
  } catch (error) {
    return err(
      new NotificationSettingsManagementError(
        "Unexpected error resetting notification settings",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Check if user has specific notification type enabled
 */
export async function isNotificationEnabled(
  context: Context,
  userId: string,
  notificationType: "email" | "checkin" | "editorInvite" | "system",
): Promise<Result<boolean, NotificationSettingsManagementError>> {
  try {
    const settingsResult = await getNotificationSettings(context, userId);
    if (settingsResult.isErr()) {
      return err(settingsResult.error);
    }

    const settings = settingsResult.value;

    switch (notificationType) {
      case "email":
        return ok(settings.emailNotifications);
      case "checkin":
        return ok(settings.checkinNotifications);
      case "editorInvite":
        return ok(settings.editorInviteNotifications);
      case "system":
        return ok(settings.systemNotifications);
      default:
        return err(
          new NotificationSettingsManagementError(
            "Invalid notification type",
            ERROR_CODES.VALIDATION_ERROR,
          ),
        );
    }
  } catch (error) {
    return err(
      new NotificationSettingsManagementError(
        "Unexpected error checking notification status",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Enable all notifications for a user
 */
export async function enableAllNotifications(
  context: Context,
  userId: string,
): Promise<Result<NotificationSettings, NotificationSettingsManagementError>> {
  return updateNotificationSettings(context, userId, {
    emailNotifications: true,
    checkinNotifications: true,
    editorInviteNotifications: true,
    systemNotifications: true,
  });
}

/**
 * Disable all notifications for a user
 */
export async function disableAllNotifications(
  context: Context,
  userId: string,
): Promise<Result<NotificationSettings, NotificationSettingsManagementError>> {
  return updateNotificationSettings(context, userId, {
    emailNotifications: false,
    checkinNotifications: false,
    editorInviteNotifications: false,
    systemNotifications: false,
  });
}

/**
 * Get notification preferences summary for user
 */
export async function getNotificationSummary(
  context: Context,
  userId: string,
): Promise<
  Result<
    {
      settings: NotificationSettings;
      enabledCount: number;
      totalCount: number;
      allEnabled: boolean;
      allDisabled: boolean;
    },
    NotificationSettingsManagementError
  >
> {
  try {
    const settingsResult = await getNotificationSettings(context, userId);
    if (settingsResult.isErr()) {
      return err(settingsResult.error);
    }

    const settings = settingsResult.value;

    const notifications = [
      settings.emailNotifications,
      settings.checkinNotifications,
      settings.editorInviteNotifications,
      settings.systemNotifications,
    ];

    const enabledCount = notifications.filter(Boolean).length;
    const totalCount = notifications.length;
    const allEnabled = enabledCount === totalCount;
    const allDisabled = enabledCount === 0;

    return ok({
      settings,
      enabledCount,
      totalCount,
      allEnabled,
      allDisabled,
    });
  } catch (error) {
    return err(
      new NotificationSettingsManagementError(
        "Unexpected error getting notification summary",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
