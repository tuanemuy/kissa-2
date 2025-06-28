import { err, ok, type Result } from "neverthrow";
import type {
  AddPlaceToFavoritesParams,
  PlaceFavorite,
  PlaceWithStats,
} from "@/core/domain/place/types";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class PlaceFavoriteApplicationError extends AnyError {
  override readonly name = "PlaceFavoriteApplicationError";

  constructor(message: string, cause?: unknown) {
    super(message, undefined, cause);
  }
}

/**
 * Add a place to user's favorites
 */
export async function addPlaceToFavorites(
  context: Context,
  params: AddPlaceToFavoritesParams,
): Promise<Result<PlaceFavorite, PlaceFavoriteApplicationError>> {
  // Check if place exists
  const placeResult = await context.placeRepository.findById(params.placeId);
  if (placeResult.isErr()) {
    return err(
      new PlaceFavoriteApplicationError(
        "Failed to verify place existence",
        placeResult.error,
      ),
    );
  }

  if (!placeResult.value) {
    return err(new PlaceFavoriteApplicationError("Place not found"));
  }

  // Check if already favorited
  const existingFavoriteResult =
    await context.placeFavoriteRepository.findByUserAndPlace(
      params.userId,
      params.placeId,
    );
  if (existingFavoriteResult.isErr()) {
    return err(
      new PlaceFavoriteApplicationError(
        "Failed to check existing favorite",
        existingFavoriteResult.error,
      ),
    );
  }

  if (existingFavoriteResult.value) {
    return err(new PlaceFavoriteApplicationError("Place is already favorited"));
  }

  // Add to favorites
  const addResult = await context.placeFavoriteRepository.add(params);
  if (addResult.isErr()) {
    return err(
      new PlaceFavoriteApplicationError(
        "Failed to add place to favorites",
        addResult.error,
      ),
    );
  }

  return ok(addResult.value);
}

/**
 * Remove a place from user's favorites
 */
export async function removePlaceFromFavorites(
  context: Context,
  userId: string,
  placeId: string,
): Promise<Result<void, PlaceFavoriteApplicationError>> {
  // Check if favorited
  const existingFavoriteResult =
    await context.placeFavoriteRepository.findByUserAndPlace(userId, placeId);
  if (existingFavoriteResult.isErr()) {
    return err(
      new PlaceFavoriteApplicationError(
        "Failed to check existing favorite",
        existingFavoriteResult.error,
      ),
    );
  }

  if (!existingFavoriteResult.value) {
    return err(new PlaceFavoriteApplicationError("Place is not favorited"));
  }

  // Remove from favorites
  const removeResult = await context.placeFavoriteRepository.remove(
    userId,
    placeId,
  );
  if (removeResult.isErr()) {
    return err(
      new PlaceFavoriteApplicationError(
        "Failed to remove place from favorites",
        removeResult.error,
      ),
    );
  }

  return ok(undefined);
}

/**
 * Get user's favorite places
 */
export async function getUserFavoritePlaces(
  context: Context,
  userId: string,
  limit?: number,
): Promise<Result<PlaceWithStats[], PlaceFavoriteApplicationError>> {
  const result = await context.placeFavoriteRepository.getPlacesWithFavorites(
    userId,
    limit,
  );
  if (result.isErr()) {
    return err(
      new PlaceFavoriteApplicationError(
        "Failed to get favorite places",
        result.error,
      ),
    );
  }

  return ok(result.value);
}

/**
 * Get user's favorite place list (metadata only)
 */
export async function getUserFavoriteList(
  context: Context,
  userId: string,
): Promise<Result<PlaceFavorite[], PlaceFavoriteApplicationError>> {
  const result = await context.placeFavoriteRepository.findByUser(userId);
  if (result.isErr()) {
    return err(
      new PlaceFavoriteApplicationError(
        "Failed to get favorite list",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
