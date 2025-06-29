import { err, ok, type Result } from "neverthrow";
import type {
  AddPlaceToFavoritesParams,
  PlaceFavorite,
  PlaceWithStats,
} from "@/core/domain/place/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class PlaceFavoriteApplicationError extends AnyError {
  override readonly name = "PlaceFavoriteApplicationError";
}

/**
 * Add a place to user's favorites
 */
export async function addPlaceToFavorites(
  context: Context,
  params: AddPlaceToFavoritesParams,
): Promise<Result<PlaceFavorite, PlaceFavoriteApplicationError>> {
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(params.userId) || !uuidRegex.test(params.placeId)) {
    return err(
      new PlaceFavoriteApplicationError(
        "Invalid UUID format",
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  // Check if place exists
  const placeResult = await context.placeRepository.findById(params.placeId);
  if (placeResult.isErr()) {
    return err(
      new PlaceFavoriteApplicationError(
        "Failed to verify place existence",
        ERROR_CODES.INTERNAL_ERROR,
        placeResult.error,
      ),
    );
  }

  if (!placeResult.value) {
    return err(
      new PlaceFavoriteApplicationError(
        "Place not found",
        ERROR_CODES.PLACE_NOT_FOUND,
      ),
    );
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
        ERROR_CODES.INTERNAL_ERROR,
        existingFavoriteResult.error,
      ),
    );
  }

  if (existingFavoriteResult.value) {
    return err(
      new PlaceFavoriteApplicationError(
        "Place is already favorited",
        ERROR_CODES.ALREADY_EXISTS,
      ),
    );
  }

  // Add to favorites
  const addResult = await context.placeFavoriteRepository.add(params);
  if (addResult.isErr()) {
    // If it's a duplicate error, return the appropriate message
    if (addResult.error.message === "Place is already favorited") {
      return err(
        new PlaceFavoriteApplicationError(
          "Place is already favorited",
          ERROR_CODES.ALREADY_EXISTS,
        ),
      );
    }
    return err(
      new PlaceFavoriteApplicationError(
        "Failed to add place to favorites",
        ERROR_CODES.INTERNAL_ERROR,
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
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId) || !uuidRegex.test(placeId)) {
    return err(
      new PlaceFavoriteApplicationError(
        "Invalid UUID format",
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  // Check if favorited
  const existingFavoriteResult =
    await context.placeFavoriteRepository.findByUserAndPlace(userId, placeId);
  if (existingFavoriteResult.isErr()) {
    return err(
      new PlaceFavoriteApplicationError(
        "Failed to check existing favorite",
        ERROR_CODES.INTERNAL_ERROR,
        existingFavoriteResult.error,
      ),
    );
  }

  if (!existingFavoriteResult.value) {
    return err(
      new PlaceFavoriteApplicationError(
        "Place is not favorited",
        ERROR_CODES.NOT_FOUND,
      ),
    );
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
        ERROR_CODES.INTERNAL_ERROR,
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
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return err(
      new PlaceFavoriteApplicationError(
        "Invalid UUID format",
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  const result = await context.placeFavoriteRepository.getPlacesWithFavorites(
    userId,
    limit,
  );
  if (result.isErr()) {
    return err(
      new PlaceFavoriteApplicationError(
        "Failed to get favorite places",
        ERROR_CODES.INTERNAL_ERROR,
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
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return err(
      new PlaceFavoriteApplicationError(
        "Invalid UUID format",
        ERROR_CODES.VALIDATION_ERROR,
      ),
    );
  }

  const result = await context.placeFavoriteRepository.findByUser(userId);
  if (result.isErr()) {
    return err(
      new PlaceFavoriteApplicationError(
        "Failed to get favorite list",
        ERROR_CODES.INTERNAL_ERROR,
        result.error,
      ),
    );
  }

  return ok(result.value);
}
