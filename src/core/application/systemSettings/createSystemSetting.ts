import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type {
  SystemSetting,
  SystemSettingKey,
} from "@/core/domain/systemSettings/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class CreateSystemSettingError extends AnyError {
  override readonly name = "CreateSystemSettingError";
}

export const createSystemSettingInputSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});
export type CreateSystemSettingInput = z.infer<
  typeof createSystemSettingInputSchema
>;

export async function createSystemSetting(
  context: Context,
  userId: string,
  input: CreateSystemSettingInput,
): Promise<Result<SystemSetting, CreateSystemSettingError>> {
  try {
    // Verify user exists and has admin permission
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new CreateSystemSettingError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new CreateSystemSettingError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new CreateSystemSettingError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Check if user has admin role
    if (user.role !== "admin") {
      return err(
        new CreateSystemSettingError(
          "User does not have permission to manage system settings",
          ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        ),
      );
    }

    // Check if setting with the same key already exists
    const existingSettingResult =
      await context.systemSettingsRepository.findByKey(
        input.key as SystemSettingKey,
      );
    if (existingSettingResult.isErr()) {
      return err(
        new CreateSystemSettingError(
          "Failed to check existing setting",
          ERROR_CODES.INTERNAL_ERROR,
          existingSettingResult.error,
        ),
      );
    }

    if (existingSettingResult.value) {
      return err(
        new CreateSystemSettingError(
          "Setting with this key already exists",
          ERROR_CODES.DUPLICATE_RESOURCE,
        ),
      );
    }

    // Create system setting
    const settingResult = await context.systemSettingsRepository.create({
      key: input.key,
      value: input.value,
      description: input.description,
      isActive: input.isActive,
    });

    if (settingResult.isErr()) {
      return err(
        new CreateSystemSettingError(
          "Failed to create system setting",
          ERROR_CODES.INTERNAL_ERROR,
          settingResult.error,
        ),
      );
    }

    return ok(settingResult.value);
  } catch (error) {
    return err(
      new CreateSystemSettingError(
        "Unexpected error during system setting creation",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
