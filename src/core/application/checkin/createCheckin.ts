import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Checkin } from "@/core/domain/checkin/types";
import { LOCATION } from "@/core/domain/constants";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class CreateCheckinError extends AnyError {
  override readonly name = "CreateCheckinError";
}

export const createCheckinInputSchema = z.object({
  placeId: z.string().uuid(),
  comment: z.string().max(1000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  userLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  isPrivate: z.boolean().default(false),
  photos: z
    .array(
      z.object({
        url: z.string().url(),
        caption: z.string().max(200).optional(),
      }),
    )
    .default([]),
});
export type CreateCheckinInput = z.infer<typeof createCheckinInputSchema>;

export async function createCheckin(
  context: Context,
  userId: string,
  input: CreateCheckinInput,
): Promise<Result<Checkin, CreateCheckinError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new CreateCheckinError(
          "Failed to find user",
          ERROR_CODES.INTERNAL_ERROR,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new CreateCheckinError("User not found", ERROR_CODES.USER_NOT_FOUND),
      );
    }

    if (user.status !== "active") {
      return err(
        new CreateCheckinError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Verify place exists
    const placeResult = await context.placeRepository.findById(input.placeId);
    if (placeResult.isErr()) {
      return err(
        new CreateCheckinError(
          "Failed to find place",
          ERROR_CODES.INTERNAL_ERROR,
          placeResult.error,
        ),
      );
    }

    const place = placeResult.value;
    if (!place) {
      return err(
        new CreateCheckinError("Place not found", ERROR_CODES.PLACE_NOT_FOUND),
      );
    }

    if (place.status !== "published") {
      return err(
        new CreateCheckinError(
          "Cannot check in to unpublished place",
          ERROR_CODES.PLACE_NOT_PUBLISHED,
        ),
      );
    }

    // Validate user location against place location
    const locationValidationResult =
      await context.locationService.validateUserLocation({
        userLocation: input.userLocation,
        placeLocation: place.coordinates,
        maxDistanceMeters: LOCATION.DEFAULT_CHECKIN_DISTANCE_METERS,
      });

    if (locationValidationResult.isErr()) {
      return err(
        new CreateCheckinError(
          "Failed to validate location",
          ERROR_CODES.LOCATION_VALIDATION_FAILED,
          locationValidationResult.error,
        ),
      );
    }

    if (!locationValidationResult.value) {
      return err(
        new CreateCheckinError(
          "User location is too far from place",
          ERROR_CODES.CHECKIN_TOO_FAR,
        ),
      );
    }

    // Check if user has already checked in to this place recently (within 24 hours)
    const hasRecentCheckin = await context.checkinRepository.hasUserCheckedIn(
      userId,
      input.placeId,
    );
    if (hasRecentCheckin.isErr()) {
      // Log error but don't fail checkin
      console.error("Failed to check recent checkin:", hasRecentCheckin.error);
    }

    // Execute checkin creation and related updates in a transaction
    const transactionResult = await context.withTransaction(
      async (txContext) => {
        // Create checkin
        const checkinResult = await txContext.checkinRepository.create(userId, {
          placeId: input.placeId,
          comment: input.comment,
          rating: input.rating,
          userLocation: input.userLocation,
          isPrivate: input.isPrivate,
        });

        if (checkinResult.isErr()) {
          return err(
            new CreateCheckinError(
              "Failed to create checkin",
              ERROR_CODES.INTERNAL_ERROR,
              checkinResult.error,
            ),
          );
        }

        const checkin = checkinResult.value;

        // Add photos if provided
        if (input.photos.length > 0) {
          const photosResult = await txContext.checkinPhotoRepository.add({
            checkinId: checkin.id,
            photos: input.photos,
          });

          if (photosResult.isErr()) {
            return err(
              new CreateCheckinError(
                "Failed to add checkin photos",
                ERROR_CODES.PHOTOS_UPLOAD_FAILED,
                photosResult.error,
              ),
            );
          }
        }

        // Update place checkin count
        const updateCheckinCountResult =
          await txContext.placeRepository.updateCheckinCount(input.placeId);
        if (updateCheckinCountResult.isErr()) {
          return err(
            new CreateCheckinError(
              "Failed to update place checkin count",
              ERROR_CODES.INTERNAL_ERROR,
              updateCheckinCountResult.error,
            ),
          );
        }

        // If user provided a rating, update place rating
        if (input.rating) {
          const placeStatsResult =
            await txContext.checkinRepository.getPlaceStats(input.placeId);
          if (placeStatsResult.isErr()) {
            return err(
              new CreateCheckinError(
                "Failed to get place stats",
                ERROR_CODES.INTERNAL_ERROR,
                placeStatsResult.error,
              ),
            );
          }

          const updateRatingResult =
            await txContext.placeRepository.updateRating(
              input.placeId,
              placeStatsResult.value.averageRating,
            );

          if (updateRatingResult.isErr()) {
            return err(
              new CreateCheckinError(
                "Failed to update place rating",
                ERROR_CODES.INTERNAL_ERROR,
                updateRatingResult.error,
              ),
            );
          }
        }

        return ok(checkin);
      },
    );

    if (transactionResult.isErr()) {
      return err(
        new CreateCheckinError(
          "Transaction failed",
          ERROR_CODES.TRANSACTION_FAILED,
          transactionResult.error,
        ),
      );
    }

    return ok(transactionResult.value);
  } catch (error) {
    return err(
      new CreateCheckinError(
        "Unexpected error during checkin creation",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
