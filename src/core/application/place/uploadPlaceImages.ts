import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Place } from "@/core/domain/place/types";
import type { UploadedFile } from "@/core/domain/region/ports/storageService";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class UploadPlaceImagesError extends AnyError {
  override readonly name = "UploadPlaceImagesError";
}

export const uploadPlaceImagesInputSchema = z.object({
  placeId: z.string().uuid(),
  userId: z.string().uuid(),
  files: z
    .array(
      z.object({
        buffer: z.instanceof(Buffer).or(z.instanceof(Uint8Array)),
        originalName: z.string(),
        mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp|gif)$/),
      }),
    )
    .min(1)
    .max(10), // Maximum 10 images per upload
  setCoverImage: z.boolean().default(false), // Whether to set the first image as cover
});
export type UploadPlaceImagesInput = z.infer<
  typeof uploadPlaceImagesInputSchema
>;

export async function uploadPlaceImages(
  context: Context,
  input: UploadPlaceImagesInput,
): Promise<
  Result<
    { place: Place; uploadedFiles: UploadedFile[] },
    UploadPlaceImagesError
  >
> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(
        new UploadPlaceImagesError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new UploadPlaceImagesError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new UploadPlaceImagesError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Verify place exists
    const placeResult = await context.placeRepository.findById(input.placeId);
    if (placeResult.isErr()) {
      return err(
        new UploadPlaceImagesError(
          "Failed to find place",
          ERROR_CODES.INTERNAL_ERROR,
          placeResult.error,
        ),
      );
    }

    const place = placeResult.value;
    if (!place) {
      return err(
        new UploadPlaceImagesError(
          "Place not found",
          ERROR_CODES.PLACE_NOT_FOUND,
        ),
      );
    }

    // Check ownership or editor permissions
    const isOwner = place.createdBy === input.userId;
    const isAdmin = user.role === "admin";

    let hasEditPermission = isOwner || isAdmin;

    // Check if user has edit permissions via PlacePermission
    if (!hasEditPermission) {
      const permissionResult =
        await context.placePermissionRepository.findByUserAndPlace(
          input.userId,
          input.placeId,
        );

      if (
        permissionResult.isOk() &&
        permissionResult.value &&
        permissionResult.value.canEdit
      ) {
        hasEditPermission = true;
      }
    }

    if (!hasEditPermission) {
      return err(
        new UploadPlaceImagesError(
          "Unauthorized to upload images to this place",
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    // Check if place is in a state that allows image uploads
    if (place.status === "archived") {
      return err(
        new UploadPlaceImagesError(
          "Cannot upload images to archived place",
          ERROR_CODES.PLACE_ARCHIVED,
        ),
      );
    }

    // Check total image count to prevent exceeding limit
    const currentImageCount = place.images.length;
    const newImageCount = input.files.length;
    const maxImages = 20; // Maximum images per place

    if (currentImageCount + newImageCount > maxImages) {
      return err(
        new UploadPlaceImagesError(
          `Cannot upload ${newImageCount} images. Would exceed maximum of ${maxImages} images per place. Current count: ${currentImageCount}`,
          ERROR_CODES.IMAGE_LIMIT_EXCEEDED,
        ),
      );
    }

    // Validate file sizes (max 10MB per file)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    for (const file of input.files) {
      if (file.buffer.length > maxFileSize) {
        return err(
          new UploadPlaceImagesError(
            `File ${file.originalName} exceeds maximum size of 10MB`,
            ERROR_CODES.FILE_TOO_LARGE,
          ),
        );
      }
    }

    // Execute upload in a transaction
    const transactionResult = await context.withTransaction(
      async (txContext) => {
        // Prepare upload parameters for storage service
        const uploadParams = input.files.map((file) => ({
          file: file.buffer,
          originalName: file.originalName,
          mimeType: file.mimeType,
          folder: `places/${input.placeId}`,
        }));

        // Upload files to storage
        const uploadResult =
          await txContext.storageService.uploadMultipleFiles(uploadParams);

        if (uploadResult.isErr()) {
          return err(
            new UploadPlaceImagesError(
              "Failed to upload images to storage",
              ERROR_CODES.FILE_UPLOAD_FAILED,
              uploadResult.error,
            ),
          );
        }

        const uploadedFiles = uploadResult.value;

        // Add new image URLs to place
        const newImageUrls = uploadedFiles.map((file) => file.url);
        const updatedImages = [...place.images, ...newImageUrls];

        // Determine cover image
        let coverImage = place.coverImage;
        if (input.setCoverImage && uploadedFiles.length > 0) {
          coverImage = uploadedFiles[0].url;
        } else if (!place.coverImage && uploadedFiles.length > 0) {
          // Auto-set cover image if none exists
          coverImage = uploadedFiles[0].url;
        }

        // Update place with new images
        const updateResult = await txContext.placeRepository.update(
          input.placeId,
          {
            images: updatedImages,
            coverImage,
          },
        );

        if (updateResult.isErr()) {
          return err(
            new UploadPlaceImagesError(
              "Failed to update place with new images",
              ERROR_CODES.INTERNAL_ERROR,
              updateResult.error,
            ),
          );
        }

        return ok({ place: updateResult.value, uploadedFiles });
      },
    );

    if (transactionResult.isErr()) {
      return err(
        new UploadPlaceImagesError(
          "Transaction failed",
          ERROR_CODES.TRANSACTION_FAILED,
          transactionResult.error,
        ),
      );
    }

    return ok(transactionResult.value);
  } catch (error) {
    return err(
      new UploadPlaceImagesError(
        "Unexpected error during image upload",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Delete a specific image from a place
 */
export async function deletePlaceImage(
  context: Context,
  placeId: string,
  userId: string,
  imageUrl: string,
): Promise<Result<Place, UploadPlaceImagesError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UploadPlaceImagesError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new UploadPlaceImagesError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new UploadPlaceImagesError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Verify place exists
    const placeResult = await context.placeRepository.findById(placeId);
    if (placeResult.isErr()) {
      return err(
        new UploadPlaceImagesError(
          "Failed to find place",
          ERROR_CODES.INTERNAL_ERROR,
          placeResult.error,
        ),
      );
    }

    const place = placeResult.value;
    if (!place) {
      return err(
        new UploadPlaceImagesError(
          "Place not found",
          ERROR_CODES.PLACE_NOT_FOUND,
        ),
      );
    }

    // Check ownership or admin privileges or edit permissions
    const isOwner = place.createdBy === userId;
    const isAdmin = user.role === "admin";

    let hasEditPermission = isOwner || isAdmin;

    // Check if user has edit permissions via PlacePermission
    if (!hasEditPermission) {
      const permissionResult =
        await context.placePermissionRepository.findByUserAndPlace(
          placeId,
          userId,
        );

      if (
        permissionResult.isOk() &&
        permissionResult.value &&
        permissionResult.value.canEdit
      ) {
        hasEditPermission = true;
      }
    }

    if (!hasEditPermission) {
      return err(
        new UploadPlaceImagesError(
          "Unauthorized to delete images from this place",
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    // Check if image exists in place
    if (!place.images.includes(imageUrl)) {
      return err(
        new UploadPlaceImagesError(
          "Image not found in place",
          ERROR_CODES.IMAGE_NOT_FOUND,
        ),
      );
    }

    // Execute deletion in a transaction
    const transactionResult = await context.withTransaction(
      async (txContext) => {
        // Remove image URL from place
        const updatedImages = place.images.filter((url) => url !== imageUrl);

        // Update cover image if it was deleted
        let updatedCoverImage = place.coverImage;
        if (place.coverImage === imageUrl) {
          updatedCoverImage =
            updatedImages.length > 0 ? updatedImages[0] : undefined;
        }

        // Update place
        const updateResult = await txContext.placeRepository.update(placeId, {
          images: updatedImages,
          coverImage: updatedCoverImage,
        });

        if (updateResult.isErr()) {
          return err(
            new UploadPlaceImagesError(
              "Failed to update place",
              ERROR_CODES.INTERNAL_ERROR,
              updateResult.error,
            ),
          );
        }

        // Delete file from storage
        const deleteResult =
          await txContext.storageService.deleteFile(imageUrl);
        if (deleteResult.isErr()) {
          // Log error but don't fail the operation
          console.error(
            "Failed to delete file from storage:",
            deleteResult.error,
          );
        }

        return ok(updateResult.value);
      },
    );

    if (transactionResult.isErr()) {
      return err(
        new UploadPlaceImagesError(
          "Transaction failed",
          ERROR_CODES.TRANSACTION_FAILED,
          transactionResult.error,
        ),
      );
    }

    return ok(transactionResult.value);
  } catch (error) {
    return err(
      new UploadPlaceImagesError(
        "Unexpected error during image deletion",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Set cover image for a place
 */
export async function setPlaceCoverImage(
  context: Context,
  placeId: string,
  userId: string,
  imageUrl: string,
): Promise<Result<Place, UploadPlaceImagesError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UploadPlaceImagesError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new UploadPlaceImagesError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new UploadPlaceImagesError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Verify place exists
    const placeResult = await context.placeRepository.findById(placeId);
    if (placeResult.isErr()) {
      return err(
        new UploadPlaceImagesError(
          "Failed to find place",
          ERROR_CODES.INTERNAL_ERROR,
          placeResult.error,
        ),
      );
    }

    const place = placeResult.value;
    if (!place) {
      return err(
        new UploadPlaceImagesError(
          "Place not found",
          ERROR_CODES.PLACE_NOT_FOUND,
        ),
      );
    }

    // Check ownership or edit permissions
    const isOwner = place.createdBy === userId;
    const isAdmin = user.role === "admin";

    let hasEditPermission = isOwner || isAdmin;

    // Check if user has edit permissions via PlacePermission
    if (!hasEditPermission) {
      const permissionResult =
        await context.placePermissionRepository.findByUserAndPlace(
          placeId,
          userId,
        );

      if (
        permissionResult.isOk() &&
        permissionResult.value &&
        permissionResult.value.canEdit
      ) {
        hasEditPermission = true;
      }
    }

    if (!hasEditPermission) {
      return err(
        new UploadPlaceImagesError(
          "Unauthorized to set cover image for this place",
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    // Check if image exists in place
    if (!place.images.includes(imageUrl)) {
      return err(
        new UploadPlaceImagesError(
          "Image not found in place",
          ERROR_CODES.IMAGE_NOT_FOUND,
        ),
      );
    }

    // Update cover image
    const updateResult = await context.placeRepository.update(placeId, {
      coverImage: imageUrl,
    });

    if (updateResult.isErr()) {
      return err(
        new UploadPlaceImagesError(
          "Failed to update place cover image",
          ERROR_CODES.INTERNAL_ERROR,
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new UploadPlaceImagesError(
        "Unexpected error during cover image update",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
