"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod/v4";
import { getCurrentUserAction } from "@/actions/auth";
import { context } from "@/context";
import {
  CreatePlaceError,
  createPlace,
  createPlaceInputSchema,
} from "@/core/application/place/createPlace";
import {
  DeletePlaceError,
  deletePlace,
} from "@/core/application/place/deletePlace";
import {
  getMapLocations,
  getPlacesByCreator,
  getPlacesByPermission,
  getPlacesByRegion,
  listPlaces,
} from "@/core/application/place/listPlaces";
import {
  advancedSearchPlaces,
  searchPlaces,
} from "@/core/application/place/searchPlaces";
import {
  UpdatePlaceError,
  updatePlace,
} from "@/core/application/place/updatePlace";
import type { CheckinWithDetails } from "@/core/domain/checkin/types";
import type {
  ListPlacesQuery,
  Place,
  PlaceCategory,
  PlaceWithStats,
  SearchPlacesQuery,
  UpdatePlaceParams,
} from "@/core/domain/place/types";
import type { Coordinates } from "@/core/domain/region/types";
import type { ActionState } from "@/lib/actionState";
import { type ValidationError, validate } from "@/lib/validation";

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
      result: {
        items: [],
        count: 0,
        totalPages: 0,
        currentPage: 1,
        searchTerm: query.keyword || "",
      },
      error: result.error,
    };
  }

  return {
    result: result.value,
    error: null,
  };
}

// Create place (editor only)
export async function createPlaceAction(
  prevState: ActionState<
    Place,
    ValidationError<z.infer<typeof createPlaceInputSchema>> | CreatePlaceError
  >,
  formData: FormData,
): Promise<
  ActionState<
    Place,
    ValidationError<z.infer<typeof createPlaceInputSchema>> | CreatePlaceError
  >
> {
  const { result: user, error: userError } = await getCurrentUserAction();

  if (userError || !user) {
    return {
      result: prevState.result,
      error: new CreatePlaceError("Authentication required"),
    };
  }

  const images = [];
  const imageUrls = formData.getAll("images") as string[];
  for (const url of imageUrls) {
    if (url?.trim()) {
      images.push(url.trim());
    }
  }

  const tags = [];
  const tagValues = formData.getAll("tags") as string[];
  for (const tag of tagValues) {
    if (tag?.trim()) {
      tags.push(tag.trim());
    }
  }

  const businessHours = [];
  const businessHoursData = formData.get("businessHours") as string;
  if (businessHoursData) {
    try {
      const parsed = JSON.parse(businessHoursData);
      if (Array.isArray(parsed)) {
        businessHours.push(...parsed);
      }
    } catch (_error) {
      // Ignore invalid JSON
    }
  }

  const coordinatesData = {
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  };

  let coordinates: { latitude: number; longitude: number } | undefined;
  if (coordinatesData.latitude && coordinatesData.longitude) {
    coordinates = {
      latitude: Number.parseFloat(coordinatesData.latitude as string),
      longitude: Number.parseFloat(coordinatesData.longitude as string),
    };
  }

  const input = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    shortDescription: (formData.get("shortDescription") as string) || undefined,
    category: formData.get("category") as PlaceCategory,
    regionId: formData.get("regionId") as string,
    coordinates: coordinates || { latitude: 0, longitude: 0 },
    address: formData.get("address") as string,
    phone: (formData.get("phone") as string) || undefined,
    website: (formData.get("website") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    coverImage: (formData.get("coverImage") as string) || undefined,
    images,
    tags,
    businessHours,
  };

  const validation = validate(createPlaceInputSchema, input);
  if (validation.isErr()) {
    return {
      result: prevState.result,
      error: validation.error,
    };
  }

  const result = await createPlace(context, user.id, validation.value);

  if (result.isErr()) {
    return {
      result: prevState.result,
      error: result.error,
    };
  }

  revalidatePath("/editor/places");
  revalidatePath("/places");
  revalidatePath(`/regions/${input.regionId}`);
  redirect(`/places/${result.value.id}`);
}

// Update place (editor only)
export async function updatePlaceAction(
  prevState: ActionState<
    Place,
    ValidationError<UpdatePlaceParams> | UpdatePlaceError
  >,
  formData: FormData,
): Promise<
  ActionState<Place, ValidationError<UpdatePlaceParams> | UpdatePlaceError>
> {
  const { result: user, error: userError } = await getCurrentUserAction();

  if (userError || !user) {
    return {
      result: prevState.result,
      error: new UpdatePlaceError("Authentication required"),
    };
  }

  const placeId = formData.get("placeId") as string;

  if (!placeId) {
    return {
      result: prevState.result,
      error: new UpdatePlaceError("Place ID is required"),
    };
  }

  const images = [];
  const imageUrls = formData.getAll("images") as string[];
  for (const url of imageUrls) {
    if (url?.trim()) {
      images.push(url.trim());
    }
  }

  const tags = [];
  const tagValues = formData.getAll("tags") as string[];
  for (const tag of tagValues) {
    if (tag?.trim()) {
      tags.push(tag.trim());
    }
  }

  const businessHours = [];
  const businessHoursData = formData.get("businessHours") as string;
  if (businessHoursData) {
    try {
      const parsed = JSON.parse(businessHoursData);
      if (Array.isArray(parsed)) {
        businessHours.push(...parsed);
      }
    } catch (_error) {
      // Ignore invalid JSON
    }
  }

  const coordinatesData = {
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  };

  let coordinates: { latitude: number; longitude: number } | undefined;
  if (coordinatesData.latitude && coordinatesData.longitude) {
    coordinates = {
      latitude: Number.parseFloat(coordinatesData.latitude as string),
      longitude: Number.parseFloat(coordinatesData.longitude as string),
    };
  }

  const params: UpdatePlaceParams = {
    name: (formData.get("name") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    shortDescription: (formData.get("shortDescription") as string) || undefined,
    category: (formData.get("category") as PlaceCategory) || undefined,
    coordinates,
    address: (formData.get("address") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    website: (formData.get("website") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    coverImage: (formData.get("coverImage") as string) || undefined,
    images: images.length > 0 ? images : undefined,
    tags: tags.length > 0 ? tags : undefined,
    businessHours: businessHours.length > 0 ? businessHours : undefined,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined),
  ) as UpdatePlaceParams;

  const result = await updatePlace(context, {
    placeId,
    userId: user.id,
    params: cleanParams,
  });

  if (result.isErr()) {
    return {
      result: prevState.result,
      error: result.error,
    };
  }

  revalidatePath("/editor/places");
  revalidatePath("/places");
  revalidatePath(`/places/${placeId}`);
  revalidatePath(`/editor/places/${placeId}/edit`);
  redirect(`/places/${result.value.id}`);
}

// Delete place (editor only)
export async function deletePlaceAction(
  placeId: string,
  userId: string,
): Promise<ActionState<void, DeletePlaceError>> {
  if (!userId) {
    return {
      result: undefined,
      error: new DeletePlaceError("User ID is required"),
    };
  }

  if (!placeId) {
    return {
      result: undefined,
      error: new DeletePlaceError("Place ID is required"),
    };
  }

  const result = await deletePlace(context, { placeId, userId });

  if (result.isErr()) {
    return {
      result: undefined,
      error: result.error,
    };
  }

  revalidatePath("/editor/places");
  revalidatePath("/places");

  return {
    result: undefined,
    error: null,
  };
}

// Advanced search with location filtering
export async function advancedSearchPlacesAction(
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
): Promise<
  ActionState<{
    items: PlaceWithStats[];
    count: number;
    totalPages: number;
    currentPage: number;
    searchTerm: string;
  }>
> {
  const result = await advancedSearchPlaces(context, filters, userId);

  if (result.isErr()) {
    return {
      result: {
        items: [],
        count: 0,
        totalPages: 0,
        currentPage: 1,
        searchTerm: filters.keyword || "",
      },
      error: result.error,
    };
  }

  return {
    result: result.value,
    error: null,
  };
}
