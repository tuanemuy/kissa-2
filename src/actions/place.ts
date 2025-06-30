"use server";

import { context } from "@/context";
import {
  getMapLocations,
  getPlacesByCreator,
  getPlacesByPermission,
  getPlacesByRegion,
  listPlaces,
} from "@/core/application/place/listPlaces";
import { searchPlaces } from "@/core/application/place/searchPlaces";
import type { CheckinWithDetails } from "@/core/domain/checkin/types";
import type {
  ListPlacesQuery,
  PlaceCategory,
  PlaceWithStats,
  SearchPlacesQuery,
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

export interface PlaceCheckin extends Omit<CheckinWithDetails, "userName"> {
  userName?: string;
  userAvatar?: string;
}

// Get Place Checkins Action
export async function getPlaceCheckinsAction(
  placeId: string,
  limit = 10,
): Promise<ActionState<PlaceCheckin[]>> {
  try {
    // Get all checkins for this place from the repository
    const checkinsResult = await context.checkinRepository.getByPlace(
      placeId,
      limit,
    );

    if (checkinsResult.isErr()) {
      return {
        result: [],
        error: checkinsResult.error,
      };
    }

    // Enhance checkins with user information
    const enhancedCheckins: PlaceCheckin[] = await Promise.all(
      checkinsResult.value.map(async (checkin: CheckinWithDetails) => {
        try {
          const userResult = await context.userRepository.findById(
            checkin.userId,
          );
          if (userResult.isOk() && userResult.value) {
            const user = userResult.value;
            return {
              ...checkin,
              userName: user.name,
              userAvatar: user.avatar,
            };
          }
        } catch (error) {
          console.error("Failed to enhance checkin with user info:", error);
        }

        return checkin;
      }),
    );

    return {
      result: enhancedCheckins,
      error: null,
    };
  } catch (error) {
    console.error("Failed to get place checkins:", error);
    return {
      result: [],
      error: {
        name: "RepositoryError",
        message: "Failed to get place checkins",
      },
    };
  }
}

// Search places
export async function searchPlacesAction(
  query: SearchPlacesQuery,
  userId?: string,
): Promise<
  ActionState<{
    items: PlaceWithStats[];
    count: number;
    totalPages: number;
    currentPage: number;
    searchTerm: string;
  }>
> {
  const result = await searchPlaces(context, { query, userId });

  if (result.isErr()) {
    return {
      result: { items: [], count: 0, totalPages: 0, currentPage: 1, searchTerm: query.keyword || "" },
      error: result.error,
    };
  }

  return {
    result: result.value,
    error: null,
  };
}
