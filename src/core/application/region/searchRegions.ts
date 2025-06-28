import { err, ok, type Result } from "neverthrow";
import type {
  RegionWithStats,
  SearchRegionsQuery,
} from "@/core/domain/region/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class SearchRegionsError extends AnyError {
  override readonly name = "SearchRegionsError";
}

export interface SearchRegionsRequest {
  query: SearchRegionsQuery;
  userId?: string;
}

export interface SearchRegionsResponse {
  items: RegionWithStats[];
  count: number;
  totalPages: number;
  currentPage: number;
  searchTerm: string;
}

/**
 * Searches regions by keyword and optional location
 *
 * Business rules:
 * - Only searches published regions
 * - Results are ranked by relevance and popularity
 * - Location-based filtering when coordinates provided
 * - Returns user-specific data when userId provided
 */
export async function searchRegions(
  context: Context,
  request: SearchRegionsRequest,
): Promise<Result<SearchRegionsResponse, SearchRegionsError>> {
  try {
    const { query, userId } = request;

    // Validate search keyword
    if (!query.keyword || query.keyword.trim().length === 0) {
      return err(
        new SearchRegionsError(
          "Search keyword is required",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Trim keyword for processing
    const trimmedKeyword = query.keyword.trim();
    const searchQuery = { ...query, keyword: trimmedKeyword };

    // Perform search
    const searchResult = await context.regionRepository.search(
      searchQuery,
      userId,
    );

    if (searchResult.isErr()) {
      return err(
        new SearchRegionsError(
          "Failed to search regions",
          ERROR_CODES.REGION_FETCH_FAILED,
          searchResult.error,
        ),
      );
    }

    const { items, count } = searchResult.value;
    const { pagination } = query;
    const totalPages = Math.ceil(count / pagination.limit);

    // Increment visit count for viewed regions (optional analytics)
    // This could be done asynchronously to avoid blocking the response
    items.forEach(async (region) => {
      await context.regionRepository.incrementVisitCount(region.id);
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
      new SearchRegionsError(
        "Unexpected error while searching regions",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Gets search suggestions based on partial keyword
 */
export async function getRegionSearchSuggestions(
  context: Context,
  partialKeyword: string,
  limit = 10,
): Promise<Result<string[], SearchRegionsError>> {
  try {
    if (!partialKeyword || partialKeyword.trim().length < 2) {
      return ok([]);
    }

    const searchQuery = {
      keyword: partialKeyword.trim(),
      pagination: {
        page: 1,
        limit,
        order: "desc" as const,
        orderBy: "createdAt",
      },
    };

    const searchResult = await context.regionRepository.search(searchQuery);

    if (searchResult.isErr()) {
      return err(
        new SearchRegionsError(
          "Failed to get search suggestions",
          ERROR_CODES.REGION_FETCH_FAILED,
          searchResult.error,
        ),
      );
    }

    // Extract unique region names as suggestions
    const suggestions = Array.from(
      new Set(searchResult.value.items.map((region) => region.name)),
    ).slice(0, limit);

    return ok(suggestions);
  } catch (error) {
    return err(
      new SearchRegionsError(
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
export async function advancedSearchRegions(
  context: Context,
  filters: {
    keyword?: string;
    tags?: string[];
    location?: {
      latitude: number;
      longitude: number;
      radiusKm: number;
    };
    pagination: {
      page: number;
      limit: number;
    };
  },
  userId?: string,
): Promise<Result<SearchRegionsResponse, SearchRegionsError>> {
  try {
    const { keyword, tags, location, pagination } = filters;

    if (!keyword && !tags?.length && !location) {
      return err(
        new SearchRegionsError(
          "At least one search criteria must be provided",
          ERROR_CODES.VALIDATION_ERROR,
        ),
      );
    }

    // Build search query
    const searchQuery: SearchRegionsQuery = {
      keyword: keyword || "",
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      location: location
        ? {
            coordinates: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            radiusKm: location.radiusKm,
          }
        : undefined,
    };

    // If only tags or location are provided, use a generic search
    if (!keyword) {
      searchQuery.keyword = "*"; // Wildcard search
    }

    const searchResult = await context.regionRepository.search(
      searchQuery,
      userId,
    );

    if (searchResult.isErr()) {
      return err(
        new SearchRegionsError(
          "Failed to perform advanced search",
          ERROR_CODES.REGION_FETCH_FAILED,
          searchResult.error,
        ),
      );
    }

    let { items, count } = searchResult.value;

    // Filter by tags if provided
    if (tags && tags.length > 0) {
      items = items.filter((region) =>
        tags.some((tag) =>
          region.tags.some((regionTag) =>
            regionTag.toLowerCase().includes(tag.toLowerCase()),
          ),
        ),
      );
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
      new SearchRegionsError(
        "Unexpected error during advanced search",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
