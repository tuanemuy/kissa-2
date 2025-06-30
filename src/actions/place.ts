"use server";

import { context } from "@/context";
import {
  getMapLocations,
  getPlacesByCreator,
  getPlacesByPermission,
  getPlacesByRegion,
  listPlaces,
} from "@/core/application/place/listPlaces";
import type {
  ListPlacesQuery,
  PlaceCategory,
  PlaceWithStats,
} from "@/core/domain/place/types";
import type { Coordinates } from "@/core/domain/region/types";
import type { ActionState } from "@/lib/actionState";

// Get place by ID
export async function getPlaceByIdAction(
  id: string,
  userId?: string,
): Promise<ActionState<PlaceWithStats | null>> {
  const result = await context.placeRepository.findById(id, userId);

  if (result.isErr()) {
    return {
      result: null,
      error: result.error,
    };
  }

  return {
    result: result.value,
    error: null,
  };
}

// List places
export async function listPlacesAction(
  query: ListPlacesQuery,
  userId?: string,
): Promise<
  ActionState<{
    items: PlaceWithStats[];
    count: number;
    totalPages: number;
    currentPage: number;
  }>
> {
  const result = await listPlaces(context, { query, userId });

  if (result.isErr()) {
    return {
      result: { items: [], count: 0, totalPages: 0, currentPage: 1 },
      error: result.error,
    };
  }

  return {
    result: result.value,
    error: null,
  };
}

// Get places by region
export async function getPlacesByRegionAction(
  regionId: string,
  userId?: string,
  limit?: number,
): Promise<ActionState<PlaceWithStats[]>> {
  // If limit is specified, use list with filter instead
  if (limit) {
    const result = await listPlaces(context, {
      query: {
        filter: {
          regionId,
          status: "published",
        },
        pagination: {
          page: 1,
          limit,
          order: "desc",
          orderBy: "createdAt",
        },
      },
      userId,
    });

    if (result.isErr()) {
      return {
        result: [],
        error: result.error,
      };
    }

    return {
      result: result.value.items,
      error: null,
    };
  }

  // Otherwise get all places in region
  const result = await getPlacesByRegion(context, regionId, userId);

  if (result.isErr()) {
    return {
      result: [],
      error: result.error,
    };
  }

  return {
    result: result.value,
    error: null,
  };
}

// Get places by creator (for editor dashboard)
export async function getPlacesByCreatorAction(
  creatorId: string,
  status?: "draft" | "published" | "archived",
): Promise<ActionState<PlaceWithStats[]>> {
  const result = await getPlacesByCreator(context, creatorId, status);

  if (result.isErr()) {
    return {
      result: [],
      error: result.error,
    };
  }

  return {
    result: result.value,
    error: null,
  };
}

// Get places by permission (for editor management)
export async function getPlacesByPermissionAction(
  userId: string,
): Promise<ActionState<PlaceWithStats[]>> {
  const result = await getPlacesByPermission(context, userId);

  if (result.isErr()) {
    return {
      result: [],
      error: result.error,
    };
  }

  return {
    result: result.value,
    error: null,
  };
}

// Get map locations for a region
export async function getMapLocationsAction(regionId: string): Promise<
  ActionState<
    Array<{
      id: string;
      name: string;
      coordinates: Coordinates;
      category: PlaceCategory;
    }>
  >
> {
  const result = await getMapLocations(context, regionId);

  if (result.isErr()) {
    return {
      result: [],
      error: result.error,
    };
  }

  return {
    result: result.value,
    error: null,
  };
}
