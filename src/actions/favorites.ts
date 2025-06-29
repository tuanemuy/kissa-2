"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import {
  addPlaceToFavorites,
  getUserFavoritePlaces,
  removePlaceFromFavorites,
} from "@/core/application/place/manageFavorites";
import {
  addRegionToFavorites,
  getUserFavoriteRegions,
  removeRegionFromFavorites,
} from "@/core/application/region/manageFavorites";
import type { FormState } from "@/lib/formState";
import { validate } from "@/lib/validation";
import { context } from "./context";

// Add region to favorites
const addRegionToFavoritesSchema = z.object({
  userId: z.string().uuid(),
  regionId: z.string().uuid(),
});

export async function addRegionToFavoritesAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const input = {
    userId: formData.get("userId"),
    regionId: formData.get("regionId"),
  };

  const validation = validate(addRegionToFavoritesSchema, input);
  if (validation.isErr()) {
    return {
      input,
      error: validation.error,
    };
  }

  const result = await addRegionToFavorites(context, validation.value);

  if (result.isErr()) {
    return {
      input,
      error: result.error,
    };
  }

  revalidatePath("/favorites");
  revalidatePath("/dashboard");
  revalidatePath(`/regions/${validation.value.regionId}`);

  return {
    input,
    result: result.value,
    error: null,
  };
}

// Remove region from favorites
export async function removeRegionFromFavoritesAction(
  userId: string,
  regionId: string,
) {
  const result = await removeRegionFromFavorites(context, userId, regionId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  revalidatePath("/favorites");
  revalidatePath("/dashboard");
  revalidatePath(`/regions/${regionId}`);

  return result.value;
}

// Get user's favorite regions
export async function getUserFavoriteRegionsAction(userId: string) {
  const result = await getUserFavoriteRegions(context, userId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Add place to favorites
const addPlaceToFavoritesSchema = z.object({
  userId: z.string().uuid(),
  placeId: z.string().uuid(),
});

export async function addPlaceToFavoritesAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const input = {
    userId: formData.get("userId"),
    placeId: formData.get("placeId"),
  };

  const validation = validate(addPlaceToFavoritesSchema, input);
  if (validation.isErr()) {
    return {
      input,
      error: validation.error,
    };
  }

  const result = await addPlaceToFavorites(context, validation.value);

  if (result.isErr()) {
    return {
      input,
      error: result.error,
    };
  }

  revalidatePath("/favorites");
  revalidatePath("/dashboard");
  revalidatePath(`/places/${validation.value.placeId}`);

  return {
    input,
    result: result.value,
    error: null,
  };
}

// Remove place from favorites
export async function removePlaceFromFavoritesAction(
  userId: string,
  placeId: string,
) {
  const result = await removePlaceFromFavorites(context, userId, placeId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  revalidatePath("/favorites");
  revalidatePath("/dashboard");
  revalidatePath(`/places/${placeId}`);

  return result.value;
}

// Get user's favorite places
export async function getUserFavoritePlacesAction(userId: string) {
  const result = await getUserFavoritePlaces(context, userId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}
