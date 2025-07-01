import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { SystemSetting } from "@/core/domain/systemSettings/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class UpdateSystemSettingError extends AnyError {
  override readonly name = "UpdateSystemSettingError";
}

export const updateSystemSettingInputSchema = z.object({
  id: z.string().uuid(),
  value: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateSystemSettingInput = z.infer<
  typeof updateSystemSettingInputSchema
>;

export async function updateSystemSetting(
  context: Context,
  userId: string,
  input: UpdateSystemSettingInput,
): Promise<Result<SystemSetting, UpdateSystemSettingError>> {
  try {
    // Verify user exists and has admin permission
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UpdateSystemSettingError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new UpdateSystemSettingError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new UpdateSystemSettingError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Check if user has admin role
    if (user.role !== "admin") {
      return err(
        new UpdateSystemSettingError(
          "User does not have permission to manage system settings",
          ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        ),
      );
    }

    // Verify setting exists
    const existingSettingResult =
      await context.systemSettingsRepository.findById(input.id);
    if (existingSettingResult.isErr()) {
      return err(
        new UpdateSystemSettingError(
          "Failed to find system setting",
          ERROR_CODES.INTERNAL_ERROR,
          existingSettingResult.error,
        ),
      );
    }

    if (!existingSettingResult.value) {
      return err(
        new UpdateSystemSettingError(
          "System setting not found",
          ERROR_CODES.RESOURCE_NOT_FOUND,
        ),
      );
    }

    // Update system setting
    const settingResult = await context.systemSettingsRepository.update({
      id: input.id,
      value: input.value,
      description: input.description,
      isActive: input.isActive,
    });

    if (settingResult.isErr()) {
      return err(
        new UpdateSystemSettingError(
          "Failed to update system setting",
          ERROR_CODES.INTERNAL_ERROR,
          settingResult.error,
        ),
      );
    }

    return ok(settingResult.value);
  } catch (error) {
    return err(
      new UpdateSystemSettingError(
        "Unexpected error during system setting update",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
