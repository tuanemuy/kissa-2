import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type {
  SystemSetting,
  SystemSettingKey,
} from "@/core/domain/systemSettings/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class SetSystemSettingValueError extends AnyError {
  override readonly name = "SetSystemSettingValueError";
}

export const setSystemSettingValueInputSchema = z.object({
  key: z.string(),
  value: z.string(),
});
export type SetSystemSettingValueInput = z.infer<
  typeof setSystemSettingValueInputSchema
>;

export async function setSystemSettingValue(
  context: Context,
  userId: string,
  input: SetSystemSettingValueInput,
): Promise<Result<SystemSetting, SetSystemSettingValueError>> {
  try {
    // Verify user exists and has admin permission
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new SetSystemSettingValueError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new SetSystemSettingValueError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new SetSystemSettingValueError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Check if user has admin role
    if (user.role !== "admin") {
      return err(
        new SetSystemSettingValueError(
          "User does not have permission to manage system settings",
          ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        ),
      );
    }

    // Set system setting value
    const settingResult =
      await context.systemSettingsRepository.setSettingValue(
        input.key as SystemSettingKey,
        input.value,
      );

    if (settingResult.isErr()) {
      return err(
        new SetSystemSettingValueError(
          "Failed to set system setting value",
          ERROR_CODES.INTERNAL_ERROR,
          settingResult.error,
        ),
      );
    }

    return ok(settingResult.value);
  } catch (error) {
    return err(
      new SetSystemSettingValueError(
        "Unexpected error during system setting value update",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
