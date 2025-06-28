import { z } from "zod/v4";
import { err, ok, type Result } from "neverthrow";
import type { Region } from "@/core/domain/region/types";
import type { Context } from "../context";
import { AnyError } from "@/lib/error";

export class CreateRegionError extends AnyError {
  override readonly name = "CreateRegionError";
  
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export const createRegionInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  shortDescription: z.string().max(300).optional(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  address: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string().max(50)).default([]),
});
export type CreateRegionInput = z.infer<typeof createRegionInputSchema>;

export async function createRegion(
  context: Context,
  userId: string,
  input: CreateRegionInput
): Promise<Result<Region, CreateRegionError>> {
  try {
    // Verify user exists and has permission to create regions
    const userResult = await context.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(new CreateRegionError("Failed to find user", userResult.error));
    }

    const user = userResult.value;
    if (!user) {
      return err(new CreateRegionError("User not found"));
    }

    if (user.status !== "active") {
      return err(new CreateRegionError("User account is not active"));
    }

    // Check if user has editor role or admin role
    if (user.role !== "editor" && user.role !== "admin") {
      return err(new CreateRegionError("User does not have permission to create regions"));
    }

    // Create region
    const regionResult = await context.regionRepository.create(userId, {
      name: input.name,
      description: input.description,
      shortDescription: input.shortDescription,
      coordinates: input.coordinates,
      address: input.address,
      coverImage: input.coverImage,
      images: input.images,
      tags: input.tags,
    });

    if (regionResult.isErr()) {
      return err(new CreateRegionError("Failed to create region", regionResult.error));
    }

    return ok(regionResult.value);
  } catch (error) {
    return err(new CreateRegionError("Unexpected error during region creation", error));
  }
}