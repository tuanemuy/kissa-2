import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { CheckinWithDetails } from "@/core/domain/checkin/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class ListUserCheckinsError extends AnyError {
  override readonly name = "ListUserCheckinsError";
}

export const listUserCheckinsInputSchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(20),
});
export type ListUserCheckinsInput = z.infer<typeof listUserCheckinsInputSchema>;

/**
 * List user's checkins with pagination
 */
export async function listUserCheckins(
  context: Context,
  input: ListUserCheckinsInput,
): Promise<Result<CheckinWithDetails[], ListUserCheckinsError>> {
  try {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(input.userId)) {
      return err(
        new ListUserCheckinsError(
          "Invalid UUID format",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Verify user exists
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(
        new ListUserCheckinsError(
          "Failed to find user",
          ERROR_CODES.INTERNAL_ERROR,
          userResult.error,
        ),
      );
    }

    if (!userResult.value) {
      return err(
        new ListUserCheckinsError("User not found", ERROR_CODES.USER_NOT_FOUND),
      );
    }

    // Get user's checkins
    const checkinsResult = await context.checkinRepository.getByUser(
      input.userId,
      input.limit,
    );

    if (checkinsResult.isErr()) {
      return err(
        new ListUserCheckinsError(
          "Failed to get user checkins",
          ERROR_CODES.INTERNAL_ERROR,
          checkinsResult.error,
        ),
      );
    }

    return ok(checkinsResult.value);
  } catch (error) {
    return err(
      new ListUserCheckinsError(
        "Unexpected error during checkin listing",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get user's recent checkins (last 10)
 */
export async function getUserRecentCheckins(
  context: Context,
  userId: string,
): Promise<Result<CheckinWithDetails[], ListUserCheckinsError>> {
  return listUserCheckins(context, { userId, limit: 10 });
}

/**
 * Get checkin details by ID
 */
export async function getCheckinDetails(
  context: Context,
  checkinId: string,
  userId?: string,
): Promise<Result<CheckinWithDetails, ListUserCheckinsError>> {
  try {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(checkinId)) {
      return err(
        new ListUserCheckinsError(
          "Invalid checkin ID format",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Get checkin details
    const checkinResult = await context.checkinRepository.findById(checkinId);
    if (checkinResult.isErr()) {
      return err(
        new ListUserCheckinsError(
          "Failed to get checkin details",
          ERROR_CODES.INTERNAL_ERROR,
          checkinResult.error,
        ),
      );
    }

    if (!checkinResult.value) {
      return err(
        new ListUserCheckinsError(
          "Checkin not found",
          ERROR_CODES.CHECKIN_NOT_FOUND,
        ),
      );
    }

    const checkin = checkinResult.value;

    // If userId is provided, check ownership
    if (userId && checkin.userId !== userId) {
      // Check if it's a private checkin
      if (checkin.isPrivate) {
        return err(
          new ListUserCheckinsError(
            "Checkin not found",
            ERROR_CODES.CHECKIN_NOT_FOUND,
          ),
        );
      }
    }

    return ok(checkin);
  } catch (error) {
    return err(
      new ListUserCheckinsError(
        "Unexpected error during checkin retrieval",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
