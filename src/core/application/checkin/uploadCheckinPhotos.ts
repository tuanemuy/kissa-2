import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type {
  CheckinPhoto,
  UploadCheckinPhotosParams,
} from "@/core/domain/checkin/types";
import { CHECKIN } from "@/core/domain/constants";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class UploadCheckinPhotosError extends AnyError {
  override readonly name = "UploadCheckinPhotosError";
}

export const uploadCheckinPhotosInputSchema = z.object({
  checkinId: z.string().uuid(),
  userId: z.string().uuid(),
  photos: z
    .array(
      z.object({
        url: z.string().url(),
        caption: z.string().max(CHECKIN.MAX_CAPTION_LENGTH).optional(),
      }),
    )
    .min(1)
    .max(CHECKIN.MAX_PHOTOS_PER_CHECKIN),
});
export type UploadCheckinPhotosInput = z.infer<
  typeof uploadCheckinPhotosInputSchema
>;

export async function uploadCheckinPhotos(
  context: Context,
  input: UploadCheckinPhotosInput,
): Promise<Result<CheckinPhoto[], UploadCheckinPhotosError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(
        new UploadCheckinPhotosError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new UploadCheckinPhotosError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new UploadCheckinPhotosError(
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
        new UploadCheckinPhotosError(
          "Failed to find checkin",
          ERROR_CODES.INTERNAL_ERROR,
          checkinResult.error,
        ),
      );
    }

    const checkin = checkinResult.value;
    if (!checkin) {
      return err(
        new UploadCheckinPhotosError(
          "Checkin not found",
          ERROR_CODES.CHECKIN_NOT_FOUND,
        ),
      );
    }

    // Check ownership
    if (checkin.userId !== input.userId) {
      return err(
        new UploadCheckinPhotosError(
          "Unauthorized to upload photos to this checkin",
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    // Check if checkin is in a state that allows photo uploads
    if (checkin.status === "deleted") {
      return err(
        new UploadCheckinPhotosError(
          "Cannot upload photos to deleted checkin",
          ERROR_CODES.CHECKIN_DELETED,
        ),
      );
    }

    // Check current photo count to prevent exceeding limit
    const existingPhotosResult =
      await context.checkinPhotoRepository.findByCheckin(input.checkinId);
    if (existingPhotosResult.isErr()) {
      return err(
        new UploadCheckinPhotosError(
          "Failed to get existing photos",
          ERROR_CODES.INTERNAL_ERROR,
          existingPhotosResult.error,
        ),
      );
    }

    const existingPhotosCount = existingPhotosResult.value.length;
    const newPhotosCount = input.photos.length;
    const totalPhotosCount = existingPhotosCount + newPhotosCount;

    if (totalPhotosCount > CHECKIN.MAX_PHOTOS_PER_CHECKIN) {
      return err(
        new UploadCheckinPhotosError(
          `Cannot upload ${newPhotosCount} photos. Would exceed maximum of ${CHECKIN.MAX_PHOTOS_PER_CHECKIN} photos per checkin. Current count: ${existingPhotosCount}`,
          ERROR_CODES.PHOTO_LIMIT_EXCEEDED,
        ),
      );
    }

    // Prepare upload parameters
    const uploadParams: UploadCheckinPhotosParams = {
      checkinId: input.checkinId,
      photos: input.photos,
    };

    // Execute upload in a transaction
    const transactionResult = await context.withTransaction(
      async (txContext) => {
        // Upload photos
        const uploadResult =
          await txContext.checkinPhotoRepository.add(uploadParams);

        if (uploadResult.isErr()) {
          return err(
            new UploadCheckinPhotosError(
              "Failed to upload photos",
              ERROR_CODES.PHOTOS_UPLOAD_FAILED,
              uploadResult.error,
            ),
          );
        }

        return ok(uploadResult.value);
      },
    );

    if (transactionResult.isErr()) {
      return err(
        new UploadCheckinPhotosError(
          "Transaction failed",
          ERROR_CODES.TRANSACTION_FAILED,
          transactionResult.error,
        ),
      );
    }

    return ok(transactionResult.value);
  } catch (error) {
    return err(
      new UploadCheckinPhotosError(
        "Unexpected error during photo upload",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Delete a specific photo from a checkin
 */
export async function deleteCheckinPhoto(
  context: Context,
  photoId: string,
  userId: string,
): Promise<Result<void, UploadCheckinPhotosError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UploadCheckinPhotosError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new UploadCheckinPhotosError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new UploadCheckinPhotosError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Get photo to verify ownership
    const photoResult = await context.checkinPhotoRepository.findById(photoId);
    if (photoResult.isErr()) {
      return err(
        new UploadCheckinPhotosError(
          "Failed to find photo",
          ERROR_CODES.INTERNAL_ERROR,
          photoResult.error,
        ),
      );
    }

    const photo = photoResult.value;
    if (!photo) {
      return err(
        new UploadCheckinPhotosError(
          "Photo not found",
          ERROR_CODES.PHOTO_NOT_FOUND,
        ),
      );
    }

    // Get associated checkin to check ownership
    const checkinResult = await context.checkinRepository.findById(
      photo.checkinId,
    );
    if (checkinResult.isErr()) {
      return err(
        new UploadCheckinPhotosError(
          "Failed to find associated checkin",
          ERROR_CODES.INTERNAL_ERROR,
          checkinResult.error,
        ),
      );
    }

    const checkin = checkinResult.value;
    if (!checkin) {
      return err(
        new UploadCheckinPhotosError(
          "Associated checkin not found",
          ERROR_CODES.CHECKIN_NOT_FOUND,
        ),
      );
    }

    // Check ownership or admin privileges
    const isOwner = checkin.userId === userId;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return err(
        new UploadCheckinPhotosError(
          "Unauthorized to delete this photo",
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    // Check if checkin is in a state that allows photo deletion
    if (checkin.status === "deleted") {
      return err(
        new UploadCheckinPhotosError(
          "Cannot delete photo from deleted checkin",
          ERROR_CODES.CHECKIN_DELETED,
        ),
      );
    }

    // Delete photo
    const deleteResult = await context.checkinPhotoRepository.delete(photoId);
    if (deleteResult.isErr()) {
      return err(
        new UploadCheckinPhotosError(
          "Failed to delete photo",
          ERROR_CODES.INTERNAL_ERROR,
          deleteResult.error,
        ),
      );
    }

    return ok(undefined);
  } catch (error) {
    return err(
      new UploadCheckinPhotosError(
        "Unexpected error during photo deletion",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Update photo caption
 */
export async function updateCheckinPhotoCaption(
  context: Context,
  photoId: string,
  userId: string,
  caption: string,
): Promise<Result<CheckinPhoto, UploadCheckinPhotosError>> {
  try {
    // Validate caption length
    if (caption.length > CHECKIN.MAX_CAPTION_LENGTH) {
      return err(
        new UploadCheckinPhotosError(
          `Caption exceeds maximum length of ${CHECKIN.MAX_CAPTION_LENGTH} characters`,
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Verify user exists and is active
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UploadCheckinPhotosError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new UploadCheckinPhotosError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new UploadCheckinPhotosError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Get photo to verify ownership
    const photoResult = await context.checkinPhotoRepository.findById(photoId);
    if (photoResult.isErr()) {
      return err(
        new UploadCheckinPhotosError(
          "Failed to find photo",
          ERROR_CODES.INTERNAL_ERROR,
          photoResult.error,
        ),
      );
    }

    const photo = photoResult.value;
    if (!photo) {
      return err(
        new UploadCheckinPhotosError(
          "Photo not found",
          ERROR_CODES.PHOTO_NOT_FOUND,
        ),
      );
    }

    // Get associated checkin to check ownership
    const checkinResult = await context.checkinRepository.findById(
      photo.checkinId,
    );
    if (checkinResult.isErr()) {
      return err(
        new UploadCheckinPhotosError(
          "Failed to find associated checkin",
          ERROR_CODES.INTERNAL_ERROR,
          checkinResult.error,
        ),
      );
    }

    const checkin = checkinResult.value;
    if (!checkin) {
      return err(
        new UploadCheckinPhotosError(
          "Associated checkin not found",
          ERROR_CODES.CHECKIN_NOT_FOUND,
        ),
      );
    }

    // Check ownership
    if (checkin.userId !== userId) {
      return err(
        new UploadCheckinPhotosError(
          "Unauthorized to edit this photo",
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    // Check if checkin is in a state that allows photo editing
    if (checkin.status === "deleted") {
      return err(
        new UploadCheckinPhotosError(
          "Cannot edit photo from deleted checkin",
          ERROR_CODES.CHECKIN_DELETED,
        ),
      );
    }

    // Update caption
    const updateResult = await context.checkinPhotoRepository.updateCaption(
      photoId,
      caption,
    );
    if (updateResult.isErr()) {
      return err(
        new UploadCheckinPhotosError(
          "Failed to update photo caption",
          ERROR_CODES.INTERNAL_ERROR,
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new UploadCheckinPhotosError(
        "Unexpected error during photo caption update",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
