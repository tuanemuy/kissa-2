import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class DeleteCheckinError extends AnyError {
  override readonly name = "DeleteCheckinError";
}

export const deleteCheckinInputSchema = z.object({
  checkinId: z.string().uuid(),
  userId: z.string().uuid(),
});
export type DeleteCheckinInput = z.infer<typeof deleteCheckinInputSchema>;

export async function deleteCheckin(
  context: Context,
  input: DeleteCheckinInput,
): Promise<Result<void, DeleteCheckinError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(
        new DeleteCheckinError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new DeleteCheckinError("User not found", ERROR_CODES.USER_NOT_FOUND),
      );
    }

    if (user.status !== "active") {
      return err(
        new DeleteCheckinError(
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
        new DeleteCheckinError(
          "Failed to find checkin",
          ERROR_CODES.INTERNAL_ERROR,
          checkinResult.error,
        ),
      );
    }

    const checkin = checkinResult.value;
    if (!checkin) {
      return err(
        new DeleteCheckinError(
          "Checkin not found",
          ERROR_CODES.CHECKIN_NOT_FOUND,
        ),
      );
    }

    // Check ownership or admin privileges
    const isOwner = checkin.userId === input.userId;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return err(
        new DeleteCheckinError(
          "Unauthorized to delete this checkin",
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    // Check if checkin is already deleted
    if (checkin.status === "deleted") {
      return err(
        new DeleteCheckinError(
          "Checkin is already deleted",
          ERROR_CODES.CHECKIN_ALREADY_DELETED,
        ),
      );
    }

    // Execute deletion in a transaction
    const transactionResult = await context.withTransaction(
      async (txContext) => {
        // Soft delete the checkin (update status to deleted)
        const deleteResult = await txContext.checkinRepository.updateStatus(
          input.checkinId,
          "deleted",
        );

        if (deleteResult.isErr()) {
          return err(
            new DeleteCheckinError(
              "Failed to delete checkin",
              ERROR_CODES.INTERNAL_ERROR,
              deleteResult.error,
            ),
          );
        }

        // Delete associated photos
        const deletePhotosResult =
          await txContext.checkinPhotoRepository.deleteByCheckin(
            input.checkinId,
          );

        if (deletePhotosResult.isErr()) {
          return err(
            new DeleteCheckinError(
              "Failed to delete checkin photos",
              ERROR_CODES.INTERNAL_ERROR,
              deletePhotosResult.error,
            ),
          );
        }

        // Update place checkin count (decrease by 1)
        const updateCheckinCountResult =
          await txContext.placeRepository.updateCheckinCount(checkin.placeId);
        if (updateCheckinCountResult.isErr()) {
          return err(
            new DeleteCheckinError(
              "Failed to update place checkin count",
              ERROR_CODES.INTERNAL_ERROR,
              updateCheckinCountResult.error,
            ),
          );
        }

        // If the deleted checkin had a rating, recalculate place rating
        if (checkin.rating) {
          const placeStatsResult =
            await txContext.checkinRepository.getPlaceStats(checkin.placeId);
          if (placeStatsResult.isErr()) {
            return err(
              new DeleteCheckinError(
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
              new DeleteCheckinError(
                "Failed to update place rating",
                ERROR_CODES.INTERNAL_ERROR,
                updateRatingResult.error,
              ),
            );
          }
        }

        return ok(undefined);
      },
    );

    if (transactionResult.isErr()) {
      return err(
        new DeleteCheckinError(
          "Transaction failed",
          ERROR_CODES.TRANSACTION_FAILED,
          transactionResult.error,
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      new DeleteCheckinError(
        "Unexpected error during checkin deletion",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Hard delete a checkin (for admin use only)
 * This permanently removes the checkin from the database
 */
export async function hardDeleteCheckin(
  context: Context,
  input: DeleteCheckinInput,
): Promise<Result<void, DeleteCheckinError>> {
  try {
    // Verify user is admin
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(
        new DeleteCheckinError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new DeleteCheckinError("User not found", ERROR_CODES.USER_NOT_FOUND),
      );
    }

    if (user.role !== "admin") {
      return err(
        new DeleteCheckinError(
          "Only administrators can permanently delete checkins",
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    // Verify checkin exists
    const checkinResult = await context.checkinRepository.findById(
      input.checkinId,
    );
    if (checkinResult.isErr()) {
      return err(
        new DeleteCheckinError(
          "Failed to find checkin",
          ERROR_CODES.INTERNAL_ERROR,
          checkinResult.error,
        ),
      );
    }

    const checkin = checkinResult.value;
    if (!checkin) {
      return err(
        new DeleteCheckinError(
          "Checkin not found",
          ERROR_CODES.CHECKIN_NOT_FOUND,
        ),
      );
    }

    // Execute hard deletion in a transaction
    const transactionResult = await context.withTransaction(
      async (txContext) => {
        // Delete associated photos first
        const deletePhotosResult =
          await txContext.checkinPhotoRepository.deleteByCheckin(
            input.checkinId,
          );

        if (deletePhotosResult.isErr()) {
          return err(
            new DeleteCheckinError(
              "Failed to delete checkin photos",
              ERROR_CODES.INTERNAL_ERROR,
              deletePhotosResult.error,
            ),
          );
        }

        // Hard delete the checkin
        const deleteResult = await txContext.checkinRepository.delete(
          input.checkinId,
        );

        if (deleteResult.isErr()) {
          return err(
            new DeleteCheckinError(
              "Failed to permanently delete checkin",
              ERROR_CODES.INTERNAL_ERROR,
              deleteResult.error,
            ),
          );
        }

        // Update place statistics only if checkin was not already marked as deleted
        if (checkin.status !== "deleted") {
          // Update place checkin count
          const updateCheckinCountResult =
            await txContext.placeRepository.updateCheckinCount(checkin.placeId);
          if (updateCheckinCountResult.isErr()) {
            return err(
              new DeleteCheckinError(
                "Failed to update place checkin count",
                ERROR_CODES.INTERNAL_ERROR,
                updateCheckinCountResult.error,
              ),
            );
          }

          // If the deleted checkin had a rating, recalculate place rating
          if (checkin.rating) {
            const placeStatsResult =
              await txContext.checkinRepository.getPlaceStats(checkin.placeId);
            if (placeStatsResult.isErr()) {
              return err(
                new DeleteCheckinError(
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
                new DeleteCheckinError(
                  "Failed to update place rating",
                  ERROR_CODES.INTERNAL_ERROR,
                  updateRatingResult.error,
                ),
              );
            }
          }
        }

        return ok(undefined);
      },
    );

    if (transactionResult.isErr()) {
      return err(
        new DeleteCheckinError(
          "Transaction failed",
          ERROR_CODES.TRANSACTION_FAILED,
          transactionResult.error,
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      new DeleteCheckinError(
        "Unexpected error during checkin hard deletion",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
