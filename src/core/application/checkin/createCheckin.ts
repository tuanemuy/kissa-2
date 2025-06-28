import { z } from "zod/v4";
import { err, ok, type Result } from "neverthrow";
import type { Checkin } from "@/core/domain/checkin/types";
import type { Context } from "../context";
import { AnyError } from "@/lib/error";

export class CreateCheckinError extends AnyError {
  override readonly name = "CreateCheckinError";
  
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
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
  photos: z.array(z.object({
    url: z.string().url(),
    caption: z.string().max(200).optional(),
  })).default([]),
});
export type CreateCheckinInput = z.infer<typeof createCheckinInputSchema>;

export async function createCheckin(
  context: Context,
  userId: string,
  input: CreateCheckinInput
): Promise<Result<Checkin, CreateCheckinError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(new CreateCheckinError("Failed to find user", userResult.error));
    }

    const user = userResult.value;
    if (!user) {
      return err(new CreateCheckinError("User not found"));
    }

    if (user.status !== "active") {
      return err(new CreateCheckinError("User account is not active"));
    }

    // Verify place exists
    const placeResult = await context.placeRepository.findById(input.placeId);
    if (placeResult.isErr()) {
      return err(new CreateCheckinError("Failed to find place", placeResult.error));
    }

    const place = placeResult.value;
    if (!place) {
      return err(new CreateCheckinError("Place not found"));
    }

    if (place.status !== "published") {
      return err(new CreateCheckinError("Cannot check in to unpublished place"));
    }

    // Validate user location against place location
    const locationValidationResult = await context.locationService.validateUserLocation({
      userLocation: input.userLocation,
      placeLocation: place.coordinates,
      maxDistanceMeters: 500, // 500 meters default
    });

    if (locationValidationResult.isErr()) {
      return err(new CreateCheckinError("Failed to validate location", locationValidationResult.error));
    }

    if (!locationValidationResult.value) {
      return err(new CreateCheckinError("User location is too far from place"));
    }

    // Check if user has already checked in to this place recently (within 24 hours)
    const hasRecentCheckin = await context.checkinRepository.hasUserCheckedIn(userId, input.placeId);
    if (hasRecentCheckin.isErr()) {
      // Log error but don't fail checkin
      console.error("Failed to check recent checkin:", hasRecentCheckin.error);
    }

    // Create checkin
    const checkinResult = await context.checkinRepository.create(userId, {
      placeId: input.placeId,
      comment: input.comment,
      rating: input.rating,
      userLocation: input.userLocation,
      isPrivate: input.isPrivate,
    });

    if (checkinResult.isErr()) {
      return err(new CreateCheckinError("Failed to create checkin", checkinResult.error));
    }

    const checkin = checkinResult.value;

    // Add photos if provided
    if (input.photos.length > 0) {
      const photosResult = await context.checkinPhotoRepository.add({
        checkinId: checkin.id,
        photos: input.photos,
      });

      if (photosResult.isErr()) {
        // Log error but don't fail checkin
        console.error("Failed to add checkin photos:", photosResult.error);
      }
    }

    // Update place statistics
    const updateCheckinCountResult = await context.placeRepository.updateCheckinCount(input.placeId);
    if (updateCheckinCountResult.isErr()) {
      // Log error but don't fail checkin
      console.error("Failed to update place checkin count:", updateCheckinCountResult.error);
    }

    // If user provided a rating, update place rating
    if (input.rating) {
      const placeStatsResult = await context.checkinRepository.getPlaceStats(input.placeId);
      if (placeStatsResult.isOk()) {
        const updateRatingResult = await context.placeRepository.updateRating(
          input.placeId,
          placeStatsResult.value.averageRating
        );

        if (updateRatingResult.isErr()) {
          // Log error but don't fail checkin
          console.error("Failed to update place rating:", updateRatingResult.error);
        }
      }
    }

    return ok(checkin);
  } catch (error) {
    return err(new CreateCheckinError("Unexpected error during checkin creation", error));
  }
}