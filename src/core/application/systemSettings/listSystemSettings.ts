import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { SystemSetting } from "@/core/domain/systemSettings/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import { paginationSchema } from "@/lib/pagination";
import type { Context } from "../context";

export class ListSystemSettingsError extends AnyError {
  override readonly name = "ListSystemSettingsError";
}

export const listSystemSettingsInputSchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      key: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    .optional(),
});
export type ListSystemSettingsInput = z.infer<
  typeof listSystemSettingsInputSchema
>;

export async function listSystemSettings(
  context: Context,
  userId: string,
  input: ListSystemSettingsInput,
): Promise<
  Result<
    {
      items: SystemSetting[];
      count: number;
    },
    ListSystemSettingsError
  >
> {
  try {
    // Verify user exists and has admin permission
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new ListSystemSettingsError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new ListSystemSettingsError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new ListSystemSettingsError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Check if user has admin role
    if (user.role !== "admin") {
      return err(
        new ListSystemSettingsError(
          "User does not have permission to view system settings",
          ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        ),
      );
    }

    // List system settings
    const settingsResult = await context.systemSettingsRepository.list({
      pagination: input.pagination,
      filter: input.filter,
    });

    if (settingsResult.isErr()) {
      return err(
        new ListSystemSettingsError(
          "Failed to list system settings",
          ERROR_CODES.INTERNAL_ERROR,
          settingsResult.error,
        ),
      );
    }

    return ok(settingsResult.value);
  } catch (error) {
    return err(
      new ListSystemSettingsError(
        "Unexpected error during system settings listing",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
