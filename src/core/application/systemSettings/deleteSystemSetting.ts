import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class DeleteSystemSettingError extends AnyError {
  override readonly name = "DeleteSystemSettingError";
}

export const deleteSystemSettingInputSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteSystemSettingInput = z.infer<
  typeof deleteSystemSettingInputSchema
>;

export async function deleteSystemSetting(
  context: Context,
  userId: string,
  input: DeleteSystemSettingInput,
): Promise<Result<void, DeleteSystemSettingError>> {
  try {
    // Verify user exists and has admin permission
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new DeleteSystemSettingError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new DeleteSystemSettingError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new DeleteSystemSettingError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Check if user has admin role
    if (user.role !== "admin") {
      return err(
        new DeleteSystemSettingError(
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
        new DeleteSystemSettingError(
          "Failed to find system setting",
          ERROR_CODES.INTERNAL_ERROR,
          existingSettingResult.error,
        ),
      );
    }

    if (!existingSettingResult.value) {
      return err(
        new DeleteSystemSettingError(
          "System setting not found",
          ERROR_CODES.RESOURCE_NOT_FOUND,
        ),
      );
    }

    // Delete system setting
    const deleteResult = await context.systemSettingsRepository.delete(
      input.id,
    );

    if (deleteResult.isErr()) {
      return err(
        new DeleteSystemSettingError(
          "Failed to delete system setting",
          ERROR_CODES.INTERNAL_ERROR,
          deleteResult.error,
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      new DeleteSystemSettingError(
        "Unexpected error during system setting deletion",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
