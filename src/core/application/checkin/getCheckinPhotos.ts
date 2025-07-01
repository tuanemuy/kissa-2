import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { CheckinPhoto } from "@/core/domain/checkin/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class GetCheckinPhotosError extends AnyError {
  override readonly name = "GetCheckinPhotosError";
}

export const getCheckinPhotosInputSchema = z.object({
  checkinId: z.string().uuid(),
  userId: z.string().uuid().optional(), // Optional for public checkins
});
export type GetCheckinPhotosInput = z.infer<typeof getCheckinPhotosInputSchema>;

export async function getCheckinPhotos(
  context: Context,
  input: GetCheckinPhotosInput,
): Promise<Result<CheckinPhoto[], GetCheckinPhotosError>> {
  try {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(input.checkinId)) {
      return err(
        new GetCheckinPhotosError(
          "Invalid checkin ID format",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Verify checkin exists
    const checkinResult = await context.checkinRepository.findById(
      input.checkinId,
    );
    if (checkinResult.isErr()) {
      return err(
        new GetCheckinPhotosError(
          "Failed to find checkin",
          ERROR_CODES.INTERNAL_ERROR,
          checkinResult.error,
        ),
      );
    }

    const checkin = checkinResult.value;
    if (!checkin) {
      return err(
        new GetCheckinPhotosError(
          "Checkin not found",
          ERROR_CODES.CHECKIN_NOT_FOUND,
        ),
      );
    }

    // Check if checkin is deleted
    if (checkin.status === "deleted") {
      return err(
        new GetCheckinPhotosError(
          "Checkin not found",
          ERROR_CODES.CHECKIN_NOT_FOUND,
        ),
      );
    }

    // Check privacy and ownership
    if (checkin.isPrivate || checkin.status === "hidden") {
      if (!input.userId) {
        return err(
          new GetCheckinPhotosError(
            "Authentication required for private checkin",
            ERROR_CODES.AUTHENTICATION_REQUIRED,
          ),
        );
      }

      // Verify user exists if userId is provided
      const userResult = await context.userRepository.findById(input.userId);
      if (userResult.isErr()) {
        return err(
          new GetCheckinPhotosError(
            "Failed to find user",
            ERROR_CODES.USER_NOT_FOUND,
            userResult.error,
          ),
        );
      }

      const user = userResult.value;
      if (!user) {
        return err(
          new GetCheckinPhotosError(
            "User not found",
            ERROR_CODES.USER_NOT_FOUND,
          ),
        );
      }

      // Check if user is the owner or admin
      const isOwner = checkin.userId === input.userId;
      const isAdmin = user.role === "admin";

      if (!isOwner && !isAdmin) {
        return err(
          new GetCheckinPhotosError(
            "Unauthorized to view this checkin's photos",
            ERROR_CODES.UNAUTHORIZED,
          ),
        );
      }
    }

    // Get photos
    const photosResult = await context.checkinPhotoRepository.findByCheckin(
      input.checkinId,
    );

    if (photosResult.isErr()) {
      return err(
        new GetCheckinPhotosError(
          "Failed to get checkin photos",
          ERROR_CODES.INTERNAL_ERROR,
          photosResult.error,
        ),
      );
    }

    return ok(photosResult.value);
  } catch (error) {
    return err(
      new GetCheckinPhotosError(
        "Unexpected error during checkin photos retrieval",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Get a specific checkin photo by ID
 */
export async function getCheckinPhotoById(
  context: Context,
  photoId: string,
  userId?: string,
): Promise<Result<CheckinPhoto, GetCheckinPhotosError>> {
  try {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(photoId)) {
      return err(
        new GetCheckinPhotosError(
          "Invalid photo ID format",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Get photo
    const photoResult = await context.checkinPhotoRepository.findById(photoId);
    if (photoResult.isErr()) {
      return err(
        new GetCheckinPhotosError(
          "Failed to find photo",
          ERROR_CODES.INTERNAL_ERROR,
          photoResult.error,
        ),
      );
    }

    const photo = photoResult.value;
    if (!photo) {
      return err(
        new GetCheckinPhotosError(
          "Photo not found",
          ERROR_CODES.PHOTO_NOT_FOUND,
        ),
      );
    }

    // Get the associated checkin to check permissions
    const checkinResult = await context.checkinRepository.findById(
      photo.checkinId,
    );
    if (checkinResult.isErr()) {
      return err(
        new GetCheckinPhotosError(
          "Failed to find associated checkin",
          ERROR_CODES.INTERNAL_ERROR,
          checkinResult.error,
        ),
      );
    }

    const checkin = checkinResult.value;
    if (!checkin) {
      return err(
        new GetCheckinPhotosError(
          "Associated checkin not found",
          ERROR_CODES.CHECKIN_NOT_FOUND,
        ),
      );
    }

    // Check if checkin is deleted
    if (checkin.status === "deleted") {
      return err(
        new GetCheckinPhotosError(
          "Photo not found",
          ERROR_CODES.PHOTO_NOT_FOUND,
        ),
      );
    }

    // Check privacy and ownership
    if (checkin.isPrivate || checkin.status === "hidden") {
      if (!userId) {
        return err(
          new GetCheckinPhotosError(
            "Authentication required for private checkin photo",
            ERROR_CODES.AUTHENTICATION_REQUIRED,
          ),
        );
      }

      // Verify user exists
      const userResult = await context.userRepository.findById(userId);
      if (userResult.isErr()) {
        return err(
          new GetCheckinPhotosError(
            "Failed to find user",
            ERROR_CODES.USER_NOT_FOUND,
            userResult.error,
          ),
        );
      }

      const user = userResult.value;
      if (!user) {
        return err(
          new GetCheckinPhotosError(
            "User not found",
            ERROR_CODES.USER_NOT_FOUND,
          ),
        );
      }

      // Check if user is the owner or admin
      const isOwner = checkin.userId === userId;
      const isAdmin = user.role === "admin";

      if (!isOwner && !isAdmin) {
        return err(
          new GetCheckinPhotosError(
            "Unauthorized to view this photo",
            ERROR_CODES.UNAUTHORIZED,
          ),
        );
      }
    }

    return ok(photo);
  } catch (error) {
    return err(
      new GetCheckinPhotosError(
        "Unexpected error during photo retrieval",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
