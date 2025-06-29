import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Place } from "@/core/domain/place/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class CreatePlaceError extends AnyError {
  override readonly name = "CreatePlaceError";
}

export const createPlaceInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  shortDescription: z.string().max(300).optional(),
  category: z.enum([
    "restaurant",
    "cafe",
    "hotel",
    "shopping",
    "entertainment",
    "culture",
    "nature",
    "historical",
    "religious",
    "transportation",
    "hospital",
    "education",
    "office",
    "other",
  ]),
  regionId: z.string().uuid(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  address: z.string().max(500),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string().max(50)).default([]),
  businessHours: z
    .array(
      z.object({
        dayOfWeek: z.enum([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ]),
        openTime: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(),
        closeTime: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(),
        isClosed: z.boolean().default(false),
      }),
    )
    .default([]),
});
export type CreatePlaceInput = z.infer<typeof createPlaceInputSchema>;

export async function createPlace(
  context: Context,
  userId: string,
  input: CreatePlaceInput,
): Promise<Result<Place, CreatePlaceError>> {
  try {
    // Verify user exists and has permission to create places
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(
        new CreatePlaceError(
          "User not found",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new CreatePlaceError("User not found", ERROR_CODES.USER_NOT_FOUND),
      );
    }

    if (user.status !== "active") {
      return err(
        new CreatePlaceError(
          "User account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Check if user has editor role or admin role
    if (user.role !== "editor" && user.role !== "admin") {
      return err(
        new CreatePlaceError(
          "User does not have permission to create places",
          ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        ),
      );
    }

    // Verify region exists and user has access to it
    const regionResult = await context.regionRepository.findById(
      input.regionId,
    );
    if (regionResult.isErr()) {
      return err(
        new CreatePlaceError(
          "Failed to find region",
          ERROR_CODES.REGION_NOT_FOUND,
          regionResult.error,
        ),
      );
    }

    const region = regionResult.value;
    if (!region) {
      return err(
        new CreatePlaceError("Region not found", ERROR_CODES.REGION_NOT_FOUND),
      );
    }

    // Check if user owns the region or is admin
    if (user.role !== "admin" && region.createdBy !== userId) {
      return err(
        new CreatePlaceError(
          "User does not have permission to add places to this region",
          ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        ),
      );
    }

    // Execute place creation and region count update in a transaction
    const transactionResult = await context.withTransaction(
      async (txContext) => {
        // Create place
        const placeResult = await txContext.placeRepository.create(userId, {
          name: input.name,
          description: input.description,
          shortDescription: input.shortDescription,
          category: input.category,
          regionId: input.regionId,
          coordinates: input.coordinates,
          address: input.address,
          phone: input.phone,
          website: input.website,
          email: input.email,
          coverImage: input.coverImage,
          images: input.images,
          tags: input.tags,
          businessHours: input.businessHours,
        });

        if (placeResult.isErr()) {
          return err(
            new CreatePlaceError(
              "Failed to create place",
              ERROR_CODES.INTERNAL_ERROR,
              placeResult.error,
            ),
          );
        }

        // Update region place count
        const updateCountResult =
          await txContext.regionRepository.updatePlaceCount(input.regionId);
        if (updateCountResult.isErr()) {
          return err(
            new CreatePlaceError(
              "Failed to update region place count",
              ERROR_CODES.INTERNAL_ERROR,
              updateCountResult.error,
            ),
          );
        }

        return ok(placeResult.value);
      },
    );

    if (transactionResult.isErr()) {
      return err(
        new CreatePlaceError(
          "Transaction failed during place creation",
          ERROR_CODES.TRANSACTION_FAILED,
          transactionResult.error,
        ),
      );
    }

    return ok(transactionResult.value);
  } catch (error) {
    return err(
      new CreatePlaceError(
        "Unexpected error during place creation",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
