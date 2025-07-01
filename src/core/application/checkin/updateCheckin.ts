import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Checkin, UpdateCheckinParams } from "@/core/domain/checkin/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class UpdateCheckinError extends AnyError {
  override readonly name = "UpdateCheckinError";
}

export const updateCheckinInputSchema = z.object({
  checkinId: z.string().uuid(),
  userId: z.string().uuid(),
  comment: z.string().max(1000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  isPrivate: z.boolean().optional(),
});
export type UpdateCheckinInput = z.infer<typeof updateCheckinInputSchema>;

export async function updateCheckin(
  context: Context,
  input: UpdateCheckinInput,
): Promise<Result<Checkin, UpdateCheckinError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(
        new UpdateCheckinError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new UpdateCheckinError("User not found", ERROR_CODES.USER_NOT_FOUND),
      );
    }

    if (user.status !== "active") {
      return err(
        new UpdateCheckinError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Verify checkin exists
    const checkinResult = await context.checkinRepository.findById(
      input.checkinId,
    );
    if (checkinResult.isErr()) {
      return err(
        new UpdateCheckinError(
          "Failed to find checkin",
          ERROR_CODES.INTERNAL_ERROR,
          checkinResult.error,
        ),
      );
    }

    const checkin = checkinResult.value;
    if (!checkin) {
      return err(
        new UpdateCheckinError(
          "Checkin not found",
          ERROR_CODES.CHECKIN_NOT_FOUND,
        ),
      );
    }

    // Check ownership
    if (checkin.userId !== input.userId) {
      return err(
        new UpdateCheckinError(
          "Unauthorized to update this checkin",
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    // Check if checkin is in a state that allows updates
    if (checkin.status === "deleted") {
      return err(
        new UpdateCheckinError(
          "Cannot update deleted checkin",
          ERROR_CODES.CHECKIN_DELETED,
        ),
      );
    }

    // Prepare update parameters
    const updateParams: UpdateCheckinParams = {};
    if (input.comment !== undefined) {
      updateParams.comment = input.comment;
    }
    if (input.rating !== undefined) {
      updateParams.rating = input.rating;
    }
    if (input.isPrivate !== undefined) {
      updateParams.isPrivate = input.isPrivate;
    }

    // If no fields to update, return current checkin
    if (Object.keys(updateParams).length === 0) {
      return err(
        new UpdateCheckinError(
          "No fields to update",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Execute update in a transaction
    const transactionResult = await context.withTransaction(
      async (txContext) => {
        // Update checkin
        const updateResult = await txContext.checkinRepository.update(
          input.checkinId,
          updateParams,
        );

        if (updateResult.isErr()) {
          return err(
            new UpdateCheckinError(
              "Failed to update checkin",
              ERROR_CODES.INTERNAL_ERROR,
              updateResult.error,
            ),
          );
        }

        const updatedCheckin = updateResult.value;

        // If rating was updated, recalculate place rating
        if (input.rating !== undefined && input.rating !== checkin.rating) {
          const placeStatsResult =
            await txContext.checkinRepository.getPlaceStats(checkin.placeId);
          if (placeStatsResult.isErr()) {
            return err(
              new UpdateCheckinError(
                "Failed to get place stats",
                ERROR_CODES.INTERNAL_ERROR,
                placeStatsResult.error,
              ),
            );
          }

          const updateRatingResult =
            await txContext.placeRepository.updateRating(
              checkin.placeId,
              placeStatsResult.value.averageRating,
            );

          if (updateRatingResult.isErr()) {
            return err(
              new UpdateCheckinError(
                "Failed to update place rating",
                ERROR_CODES.INTERNAL_ERROR,
                updateRatingResult.error,
              ),
            );
          }
        }

        return ok(updatedCheckin);
      },
    );

    if (transactionResult.isErr()) {
      return err(
        new UpdateCheckinError(
          "Transaction failed",
          ERROR_CODES.TRANSACTION_FAILED,
          transactionResult.error,
        ),
      );
    }

    return ok(transactionResult.value);
  } catch (error) {
    return err(
      new UpdateCheckinError(
        "Unexpected error during checkin update",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
