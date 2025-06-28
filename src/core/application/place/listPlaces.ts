import { err, ok, type Result } from "neverthrow";
import type {
  ListPlacesQuery,
  PlaceCategory,
  PlaceWithStats,
} from "@/core/domain/place/types";
import type { Coordinates } from "@/core/domain/region/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class ListPlacesError extends AnyError {
  override readonly name = "ListPlacesError";
}

export interface ListPlacesRequest {
  query: ListPlacesQuery;
  userId?: string;
}

export interface ListPlacesResponse {
  items: PlaceWithStats[];
  count: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Lists places with filtering, sorting, and pagination
 *
 * Business rules:
 * - Only published places are visible to non-owners/non-editors
 * - Users can see places they created or have permissions for
 * - Results include user-specific data (favorites, permissions) when userId provided
 */
export async function listPlaces(
  context: Context,
  request: ListPlacesRequest,
): Promise<Result<ListPlacesResponse, ListPlacesError>> {
  try {
    const { query, userId } = request;

    // If no user is provided, only show published places
    if (!userId && query.filter) {
      query.filter.status = "published";
    }

    // Get places list
    const listResult = await context.placeRepository.list(query, userId);

    if (listResult.isErr()) {
      return err(
        new ListPlacesError(
          "Failed to list places",
          ERROR_CODES.PLACE_FETCH_FAILED,
          listResult.error,
        ),
      );
    }

    const { items, count } = listResult.value;
    const { pagination } = query;
    const totalPages = Math.ceil(count / pagination.limit);

    return ok({
      items,
      count,
      totalPages,
      currentPage: pagination.page,
    });
  } catch (error) {
    return err(
      new ListPlacesError(
        "Unexpected error while listing places",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Gets places by region
 */
export async function getPlacesByRegion(
  context: Context,
  regionId: string,
  userId?: string,
): Promise<Result<PlaceWithStats[], ListPlacesError>> {
  try {
    const placesResult = await context.placeRepository.getByRegion(
      regionId,
      userId,
    );

    if (placesResult.isErr()) {
      return err(
        new ListPlacesError(
          "Failed to get places by region",
          ERROR_CODES.PLACE_FETCH_FAILED,
          placesResult.error,
        ),
      );
    }

    return ok(placesResult.value);
  } catch (error) {
    return err(
      new ListPlacesError(
        "Unexpected error while getting places by region",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Gets places by creator with optional status filter
 */
export async function getPlacesByCreator(
  context: Context,
  creatorId: string,
  status?: "draft" | "published" | "archived",
): Promise<Result<PlaceWithStats[], ListPlacesError>> {
  try {
    const placesResult = await context.placeRepository.getByCreator(
      creatorId,
      status,
    );

    if (placesResult.isErr()) {
      return err(
        new ListPlacesError(
          "Failed to get places by creator",
          ERROR_CODES.PLACE_FETCH_FAILED,
          placesResult.error,
        ),
      );
    }

    // Convert to PlaceWithStats format
    const placesWithStats: PlaceWithStats[] = placesResult.value.map(
      (place) => ({
        ...place,
        isFavorited: false,
        hasEditPermission: false,
        hasDeletePermission: false,
        regionName: undefined,
      }),
    );

    return ok(placesWithStats);
  } catch (error) {
    return err(
      new ListPlacesError(
        "Unexpected error while getting places by creator",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Gets places where user has edit/delete permissions
 */
export async function getPlacesByPermission(
  context: Context,
  userId: string,
): Promise<Result<PlaceWithStats[], ListPlacesError>> {
  try {
    const placesResult = await context.placeRepository.getByPermission(userId);

    if (placesResult.isErr()) {
      return err(
        new ListPlacesError(
          "Failed to get places by permission",
          ERROR_CODES.PLACE_FETCH_FAILED,
          placesResult.error,
        ),
      );
    }

    return ok(placesResult.value);
  } catch (error) {
    return err(
      new ListPlacesError(
        "Unexpected error while getting places by permission",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Gets map locations for a region (simplified data for map display)
 */
export async function getMapLocations(
  context: Context,
  regionId: string,
): Promise<
  Result<
    Array<{
      id: string;
      name: string;
      coordinates: Coordinates;
      category: PlaceCategory;
    }>,
    ListPlacesError
  >
> {
  try {
    const locationsResult =
      await context.placeRepository.getMapLocations(regionId);

    if (locationsResult.isErr()) {
      return err(
        new ListPlacesError(
          "Failed to get map locations",
          ERROR_CODES.PLACE_FETCH_FAILED,
          locationsResult.error,
        ),
      );
    }

    return ok(locationsResult.value);
  } catch (error) {
    return err(
      new ListPlacesError(
        "Unexpected error while getting map locations",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
