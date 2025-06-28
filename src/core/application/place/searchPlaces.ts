import { err, ok, type Result } from "neverthrow";
import type {
  PlaceCategory,
  PlaceWithStats,
  SearchPlacesQuery,
} from "@/core/domain/place/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class SearchPlacesError extends AnyError {
  override readonly name = "SearchPlacesError";
}

export interface SearchPlacesRequest {
  query: SearchPlacesQuery;
  userId?: string;
}

export interface SearchPlacesResponse {
  items: PlaceWithStats[];
  count: number;
  totalPages: number;
  currentPage: number;
  searchTerm: string;
}

/**
 * Searches places by keyword and optional filters
 *
 * Business rules:
 * - Only searches published places
 * - Results are ranked by relevance and popularity
 * - Category and location-based filtering when provided
 * - Returns user-specific data when userId provided
 */
export async function searchPlaces(
  context: Context,
  request: SearchPlacesRequest,
): Promise<Result<SearchPlacesResponse, SearchPlacesError>> {
  try {
    const { query, userId } = request;

    // Validate search keyword
    if (!query.keyword || query.keyword.trim().length === 0) {
      return err(
        new SearchPlacesError(
          "Search keyword is required",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Trim keyword for processing
    const trimmedKeyword = query.keyword.trim();
    const searchQuery = { ...query, keyword: trimmedKeyword };

    // Perform search
    const searchResult = await context.placeRepository.search(
      searchQuery,
      userId,
    );

    if (searchResult.isErr()) {
      return err(
        new SearchPlacesError(
          "Failed to search places",
          ERROR_CODES.PLACE_FETCH_FAILED,
          searchResult.error,
        ),
      );
    }

    const { items, count } = searchResult.value;
    const { pagination } = query;
    const totalPages = Math.ceil(count / pagination.limit);

    // Increment visit count for viewed places (optional analytics)
    // This could be done asynchronously to avoid blocking the response
    items.forEach(async (place) => {
      await context.placeRepository.incrementVisitCount(place.id);
    });

    return ok({
      items,
      count,
      totalPages,
      currentPage: pagination.page,
      searchTerm: trimmedKeyword,
    });
  } catch (error) {
    return err(
      new SearchPlacesError(
        "Unexpected error while searching places",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Gets search suggestions based on partial keyword
 */
export async function getPlaceSearchSuggestions(
  context: Context,
  partialKeyword: string,
  regionId?: string,
  limit = 10,
): Promise<Result<string[], SearchPlacesError>> {
  try {
    if (!partialKeyword || partialKeyword.trim().length < 2) {
      return ok([]);
    }

    const searchQuery = {
      keyword: partialKeyword.trim(),
      regionId,
      pagination: {
        page: 1,
        limit,
        order: "desc" as const,
        orderBy: "createdAt",
      },
    };

    const searchResult = await context.placeRepository.search(searchQuery);

    if (searchResult.isErr()) {
      return err(
        new SearchPlacesError(
          "Failed to get search suggestions",
          ERROR_CODES.PLACE_FETCH_FAILED,
          searchResult.error,
        ),
      );
    }

    // Extract unique place names as suggestions
    const suggestions = Array.from(
      new Set(searchResult.value.items.map((place) => place.name)),
    ).slice(0, limit);

    return ok(suggestions);
  } catch (error) {
    return err(
      new SearchPlacesError(
        "Unexpected error while getting search suggestions",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Advanced search with multiple filters
 */
export async function advancedSearchPlaces(
  context: Context,
  filters: {
    keyword?: string;
    regionId?: string;
    category?: PlaceCategory;
    location?: {
      latitude: number;
      longitude: number;
      radiusKm: number;
    };
    hasRating?: boolean;
    minRating?: number;
    pagination: {
      page: number;
      limit: number;
    };
  },
  userId?: string,
): Promise<Result<SearchPlacesResponse, SearchPlacesError>> {
  try {
    const {
      keyword,
      regionId,
      category,
      location,
      hasRating,
      minRating,
      pagination,
    } = filters;

    if (!keyword && !regionId && !category && !location) {
      return err(
        new SearchPlacesError(
          "At least one search criteria must be provided",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Build search query
    const searchQuery: SearchPlacesQuery = {
      keyword: keyword || "",
      regionId,
      category,
      location: location
        ? {
            coordinates: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            radiusKm: location.radiusKm,
          }
        : undefined,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        order: "desc" as const,
        orderBy: "createdAt",
      },
    };

    // If only filters are provided without keyword, use a generic search
    if (!keyword) {
      searchQuery.keyword = "*"; // Wildcard search
    }

    const searchResult = await context.placeRepository.search(
      searchQuery,
      userId,
    );

    if (searchResult.isErr()) {
      return err(
        new SearchPlacesError(
          "Failed to perform advanced search",
          ERROR_CODES.PLACE_FETCH_FAILED,
          searchResult.error,
        ),
      );
    }

    let { items, count } = searchResult.value;

    // Filter by rating if specified
    if (hasRating !== undefined || minRating !== undefined) {
      items = items.filter((place) => {
        if (hasRating === true && !place.averageRating) return false;
        if (hasRating === false && place.averageRating) return false;
        if (
          minRating !== undefined &&
          (!place.averageRating || place.averageRating < minRating)
        )
          return false;
        return true;
      });
      count = items.length;
    }

    const totalPages = Math.ceil(count / pagination.limit);

    return ok({
      items,
      count,
      totalPages,
      currentPage: pagination.page,
      searchTerm: keyword || "",
    });
  } catch (error) {
    return err(
      new SearchPlacesError(
        "Unexpected error during advanced search",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Search places by category within a region
 */
export async function searchPlacesByCategory(
  context: Context,
  regionId: string,
  category: PlaceCategory,
  userId?: string,
  limit = 20,
): Promise<Result<PlaceWithStats[], SearchPlacesError>> {
  try {
    const searchQuery = {
      keyword: "*",
      regionId,
      category,
      pagination: {
        page: 1,
        limit,
        order: "desc" as const,
        orderBy: "createdAt",
      },
    };

    const searchResult = await context.placeRepository.search(
      searchQuery,
      userId,
    );

    if (searchResult.isErr()) {
      return err(
        new SearchPlacesError(
          "Failed to search places by category",
          ERROR_CODES.PLACE_FETCH_FAILED,
          searchResult.error,
        ),
      );
    }

    return ok(searchResult.value.items);
  } catch (error) {
    return err(
      new SearchPlacesError(
        "Unexpected error while searching places by category",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
