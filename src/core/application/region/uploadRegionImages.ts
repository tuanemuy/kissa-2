import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { UploadedFile } from "@/core/domain/region/ports/storageService";
import type { Region } from "@/core/domain/region/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class UploadRegionImagesError extends AnyError {
  override readonly name = "UploadRegionImagesError";
}

export const uploadRegionImagesInputSchema = z.object({
  regionId: z.string().uuid(),
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
export type UploadRegionImagesInput = z.infer<
  typeof uploadRegionImagesInputSchema
>;

export async function uploadRegionImages(
  context: Context,
  input: UploadRegionImagesInput,
): Promise<
  Result<
    { region: Region; uploadedFiles: UploadedFile[] },
    UploadRegionImagesError
  >
> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(input.userId);
    if (userResult.isErr()) {
      return err(
        new UploadRegionImagesError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new UploadRegionImagesError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new UploadRegionImagesError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Verify region exists
    const regionResult = await context.regionRepository.findById(
      input.regionId,
    );
    if (regionResult.isErr()) {
      return err(
        new UploadRegionImagesError(
          "Failed to find region",
          ERROR_CODES.INTERNAL_ERROR,
          regionResult.error,
        ),
      );
    }

    const region = regionResult.value;
    if (!region) {
      return err(
        new UploadRegionImagesError(
          "Region not found",
          ERROR_CODES.REGION_NOT_FOUND,
        ),
      );
    }

    // Check ownership or editor permissions
    const isOwner = region.createdBy === input.userId;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return err(
        new UploadRegionImagesError(
          "Unauthorized to upload images to this region",
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    // Check if region is in a state that allows image uploads
    if (region.status === "archived") {
      return err(
        new UploadRegionImagesError(
          "Cannot upload images to archived region",
          ERROR_CODES.REGION_ARCHIVED,
        ),
      );
    }

    // Check total image count to prevent exceeding limit
    const currentImageCount = region.images.length;
    const newImageCount = input.files.length;
    const maxImages = 20; // Maximum images per region

    if (currentImageCount + newImageCount > maxImages) {
      return err(
        new UploadRegionImagesError(
          `Cannot upload ${newImageCount} images. Would exceed maximum of ${maxImages} images per region. Current count: ${currentImageCount}`,
          ERROR_CODES.IMAGE_LIMIT_EXCEEDED,
        ),
      );
    }

    // Validate file sizes (max 10MB per file)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    for (const file of input.files) {
      if (file.buffer.length > maxFileSize) {
        return err(
          new UploadRegionImagesError(
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
          folder: `regions/${input.regionId}`,
        }));

        // Upload files to storage
        const uploadResult =
          await txContext.storageService.uploadMultipleFiles(uploadParams);

        if (uploadResult.isErr()) {
          return err(
            new UploadRegionImagesError(
              "Failed to upload images to storage",
              ERROR_CODES.FILE_UPLOAD_FAILED,
              uploadResult.error,
            ),
          );
        }

        const uploadedFiles = uploadResult.value;

        // Add new image URLs to region
        const newImageUrls = uploadedFiles.map((file) => file.url);
        const updatedImages = [...region.images, ...newImageUrls];

        // Determine cover image
        let coverImage = region.coverImage;
        if (input.setCoverImage && uploadedFiles.length > 0) {
          coverImage = uploadedFiles[0].url;
        } else if (!region.coverImage && uploadedFiles.length > 0) {
          // Auto-set cover image if none exists
          coverImage = uploadedFiles[0].url;
        }

        // Update region with new images
        const updateResult = await txContext.regionRepository.update(
          input.regionId,
          {
            images: updatedImages,
            coverImage,
          },
        );

        if (updateResult.isErr()) {
          return err(
            new UploadRegionImagesError(
              "Failed to update region with new images",
              ERROR_CODES.INTERNAL_ERROR,
              updateResult.error,
            ),
          );
        }

        return ok({ region: updateResult.value, uploadedFiles });
      },
    );

    if (transactionResult.isErr()) {
      return err(
        new UploadRegionImagesError(
          "Transaction failed",
          ERROR_CODES.TRANSACTION_FAILED,
          transactionResult.error,
        ),
      );
    }

    return ok(transactionResult.value);
  } catch (error) {
    return err(
      new UploadRegionImagesError(
        "Unexpected error during image upload",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Delete a specific image from a region
 */
export async function deleteRegionImage(
  context: Context,
  regionId: string,
  userId: string,
  imageUrl: string,
): Promise<Result<Region, UploadRegionImagesError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UploadRegionImagesError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new UploadRegionImagesError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new UploadRegionImagesError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Verify region exists
    const regionResult = await context.regionRepository.findById(regionId);
    if (regionResult.isErr()) {
      return err(
        new UploadRegionImagesError(
          "Failed to find region",
          ERROR_CODES.INTERNAL_ERROR,
          regionResult.error,
        ),
      );
    }

    const region = regionResult.value;
    if (!region) {
      return err(
        new UploadRegionImagesError(
          "Region not found",
          ERROR_CODES.REGION_NOT_FOUND,
        ),
      );
    }

    // Check ownership or admin privileges
    const isOwner = region.createdBy === userId;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return err(
        new UploadRegionImagesError(
          "Unauthorized to delete images from this region",
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    // Check if image exists in region
    if (!region.images.includes(imageUrl)) {
      return err(
        new UploadRegionImagesError(
          "Image not found in region",
          ERROR_CODES.IMAGE_NOT_FOUND,
        ),
      );
    }

    // Execute deletion in a transaction
    const transactionResult = await context.withTransaction(
      async (txContext) => {
        // Remove image URL from region
        const updatedImages = region.images.filter((url) => url !== imageUrl);

        // Update cover image if it was deleted
        let updatedCoverImage = region.coverImage;
        if (region.coverImage === imageUrl) {
          updatedCoverImage =
            updatedImages.length > 0 ? updatedImages[0] : undefined;
        }

        // Update region
        const updateResult = await txContext.regionRepository.update(regionId, {
          images: updatedImages,
          coverImage: updatedCoverImage,
        });

        if (updateResult.isErr()) {
          return err(
            new UploadRegionImagesError(
              "Failed to update region",
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
        new UploadRegionImagesError(
          "Transaction failed",
          ERROR_CODES.TRANSACTION_FAILED,
          transactionResult.error,
        ),
      );
    }

    return ok(transactionResult.value);
  } catch (error) {
    return err(
      new UploadRegionImagesError(
        "Unexpected error during image deletion",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Set cover image for a region
 */
export async function setRegionCoverImage(
  context: Context,
  regionId: string,
  userId: string,
  imageUrl: string,
): Promise<Result<Region, UploadRegionImagesError>> {
  try {
    // Verify user exists and is active
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new UploadRegionImagesError(
          "Failed to find user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new UploadRegionImagesError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new UploadRegionImagesError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Verify region exists
    const regionResult = await context.regionRepository.findById(regionId);
    if (regionResult.isErr()) {
      return err(
        new UploadRegionImagesError(
          "Failed to find region",
          ERROR_CODES.INTERNAL_ERROR,
          regionResult.error,
        ),
      );
    }

    const region = regionResult.value;
    if (!region) {
      return err(
        new UploadRegionImagesError(
          "Region not found",
          ERROR_CODES.REGION_NOT_FOUND,
        ),
      );
    }

    // Check ownership
    if (region.createdBy !== userId && user.role !== "admin") {
      return err(
        new UploadRegionImagesError(
          "Unauthorized to set cover image for this region",
          ERROR_CODES.UNAUTHORIZED,
        ),
      );
    }

    // Check if image exists in region
    if (!region.images.includes(imageUrl)) {
      return err(
        new UploadRegionImagesError(
          "Image not found in region",
          ERROR_CODES.IMAGE_NOT_FOUND,
        ),
      );
    }

    // Update cover image
    const updateResult = await context.regionRepository.update(regionId, {
      coverImage: imageUrl,
    });

    if (updateResult.isErr()) {
      return err(
        new UploadRegionImagesError(
          "Failed to update region cover image",
          ERROR_CODES.INTERNAL_ERROR,
          updateResult.error,
        ),
      );
    }

    return ok(updateResult.value);
  } catch (error) {
    return err(
      new UploadRegionImagesError(
        "Unexpected error during cover image update",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
