import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type {
  SystemSetting,
  SystemSettingKey,
} from "@/core/domain/systemSettings/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class GetSystemSettingError extends AnyError {
  override readonly name = "GetSystemSettingError";
}

export const getSystemSettingByIdInputSchema = z.object({
  id: z.string().uuid(),
});
export type GetSystemSettingByIdInput = z.infer<
  typeof getSystemSettingByIdInputSchema
>;

export const getSystemSettingByKeyInputSchema = z.object({
  key: z.string(),
});
export type GetSystemSettingByKeyInput = z.infer<
  typeof getSystemSettingByKeyInputSchema
>;

export async function getSystemSettingById(
  context: Context,
  userId: string,
  input: GetSystemSettingByIdInput,
): Promise<Result<SystemSetting | null, GetSystemSettingError>> {
  try {
    // Verify user exists and has admin permission
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new GetSystemSettingError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new GetSystemSettingError("User not found", ERROR_CODES.USER_NOT_FOUND),
      );
    }

    if (user.status !== "active") {
      return err(
        new GetSystemSettingError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Check if user has admin role
    if (user.role !== "admin") {
      return err(
        new GetSystemSettingError(
          "User does not have permission to view system settings",
          ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        ),
      );
    }

    // Get system setting by ID
    const settingResult = await context.systemSettingsRepository.findById(
      input.id,
    );

    if (settingResult.isErr()) {
      return err(
        new GetSystemSettingError(
          "Failed to get system setting",
          ERROR_CODES.INTERNAL_ERROR,
          settingResult.error,
        ),
      );
    }

    return ok(settingResult.value);
  } catch (error) {
    return err(
      new GetSystemSettingError(
        "Unexpected error during system setting retrieval",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

export async function getSystemSettingByKey(
  context: Context,
  userId: string,
  input: GetSystemSettingByKeyInput,
): Promise<Result<SystemSetting | null, GetSystemSettingError>> {
  try {
    // Verify user exists and has admin permission
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new GetSystemSettingError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new GetSystemSettingError("User not found", ERROR_CODES.USER_NOT_FOUND),
      );
    }

    if (user.status !== "active") {
      return err(
        new GetSystemSettingError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Check if user has admin role
    if (user.role !== "admin") {
      return err(
        new GetSystemSettingError(
          "User does not have permission to view system settings",
          ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        ),
      );
    }

    // Get system setting by key
    const settingResult = await context.systemSettingsRepository.findByKey(
      input.key as SystemSettingKey,
    );

    if (settingResult.isErr()) {
      return err(
        new GetSystemSettingError(
          "Failed to get system setting",
          ERROR_CODES.INTERNAL_ERROR,
          settingResult.error,
        ),
      );
    }

    return ok(settingResult.value);
  } catch (error) {
    return err(
      new GetSystemSettingError(
        "Unexpected error during system setting retrieval",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

// Public function to get setting value (no auth required, can be used by system)
export async function getSystemSettingValue(
  context: Context,
  key: SystemSettingKey,
): Promise<Result<string | null, GetSystemSettingError>> {
  try {
    const valueResult =
      await context.systemSettingsRepository.getSettingValue(key);

    if (valueResult.isErr()) {
      return err(
        new GetSystemSettingError(
          "Failed to get system setting value",
          ERROR_CODES.INTERNAL_ERROR,
          valueResult.error,
        ),
      );
    }

    return ok(valueResult.value);
  } catch (error) {
    return err(
      new GetSystemSettingError(
        "Unexpected error during system setting value retrieval",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
