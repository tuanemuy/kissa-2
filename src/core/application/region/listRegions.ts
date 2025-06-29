import { err, ok, type Result } from "neverthrow";
import type {
  ListRegionsQuery,
  RegionWithStats,
} from "@/core/domain/region/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class ListRegionsError extends AnyError {
  override readonly name = "ListRegionsError";
}

export interface ListRegionsRequest {
  query: ListRegionsQuery;
  userId?: string;
}

export interface ListRegionsResponse {
  items: RegionWithStats[];
  count: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Lists regions with filtering, sorting, and pagination
 *
 * Business rules:
 * - Only published regions are visible to non-owners
 * - Users can see their own regions regardless of status
 * - Results include user-specific data (favorites, pins) when userId provided
 */
export async function listRegions(
  context: Context,
  request: ListRegionsRequest,
): Promise<Result<ListRegionsResponse, ListRegionsError>> {
  try {
    const { query, userId } = request;

    // If no user is provided, only show published regions
    if (!userId) {
      if (!query.filter) {
        query.filter = {};
      }
      query.filter.status = "published";
    }

    // Get regions list
    const listResult = await context.regionRepository.list(query, userId);

    if (listResult.isErr()) {
      return err(
        new ListRegionsError(
          "Failed to list regions",
          ERROR_CODES.REGION_FETCH_FAILED,
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
      new ListRegionsError(
        "Unexpected error while listing regions",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Gets featured regions for homepage or discovery
 */
export async function getFeaturedRegions(
  context: Context,
  limit = 10,
  userId?: string,
): Promise<Result<RegionWithStats[], ListRegionsError>> {
  try {
    const featuredResult = await context.regionRepository.getFeatured(
      limit,
      userId,
    );

    if (featuredResult.isErr()) {
      return err(
        new ListRegionsError(
          "Failed to get featured regions",
          ERROR_CODES.REGION_FETCH_FAILED,
          featuredResult.error,
        ),
      );
    }

    return ok(featuredResult.value);
  } catch (error) {
    return err(
      new ListRegionsError(
        "Unexpected error while getting featured regions",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Gets regions by creator with optional status filter
 */
export async function getRegionsByCreator(
  context: Context,
  creatorId: string,
  status?: "draft" | "published" | "archived",
): Promise<Result<RegionWithStats[], ListRegionsError>> {
  try {
    const regionsResult = await context.regionRepository.getByCreator(
      creatorId,
      status,
    );

    if (regionsResult.isErr()) {
      return err(
        new ListRegionsError(
          "Failed to get regions by creator",
          ERROR_CODES.REGION_FETCH_FAILED,
          regionsResult.error,
        ),
      );
    }

    // Convert to RegionWithStats format
    const regionsWithStats: RegionWithStats[] = regionsResult.value.map(
      (region) => ({
        ...region,
        isFavorited: false,
        isPinned: false,
        pinDisplayOrder: undefined,
      }),
    );

    return ok(regionsWithStats);
  } catch (error) {
    return err(
      new ListRegionsError(
        "Unexpected error while getting regions by creator",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
