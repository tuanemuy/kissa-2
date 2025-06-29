"use server";

import { z } from "zod/v4";
import {
  getMapLocations,
  getPlacesByRegion,
  listPlaces,
} from "@/core/application/place/listPlaces";
import {
  getPlaceSearchSuggestions,
  searchPlaces,
  searchPlacesByCategory,
} from "@/core/application/place/searchPlaces";
import { placeCategorySchema } from "@/core/domain/place/types";
import { validate } from "@/lib/validation";
import { context } from "./context";

// Get places by region
export async function getPlacesByRegionAction(
  regionId: string,
  userId?: string,
) {
  const result = await getPlacesByRegion(context, regionId, userId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Get map locations for a region
export async function getMapLocationsAction(regionId: string) {
  const result = await getMapLocations(context, regionId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// List places with optional filters
const listPlacesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  orderBy: z
    .enum(["createdAt", "updatedAt", "name", "visitCount", "averageRating"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  regionId: z.string().uuid().optional(),
  category: placeCategorySchema.optional(),
  status: z.enum(["published", "draft", "archived"]).optional(),
});

export async function listPlacesAction(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const validation = validate(listPlacesSchema, searchParams);

  if (validation.isErr()) {
    throw new Error("Invalid parameters");
  }

  const { page, limit, orderBy, order, regionId, category, status } =
    validation.value;

  const result = await listPlaces(context, {
    query: {
      pagination: {
        page,
        limit,
        orderBy,
        order,
      },
      filter: {
        regionId,
        category,
        status,
      },
    },
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Search places by keyword
const searchPlacesSchema = z.object({
  keyword: z.string().min(1),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  regionId: z.string().uuid().optional(),
  category: placeCategorySchema.optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(1).max(100).default(10),
});

export async function searchPlacesAction(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const validation = validate(searchPlacesSchema, searchParams);

  if (validation.isErr()) {
    throw new Error("Invalid search parameters");
  }

  const {
    keyword,
    page,
    limit,
    regionId,
    category,
    latitude,
    longitude,
    radiusKm,
  } = validation.value;

  const result = await searchPlaces(context, {
    query: {
      keyword,
      regionId,
      category,
      pagination: {
        page,
        limit,
        orderBy: "createdAt",
        order: "desc",
      },
      location:
        latitude && longitude
          ? {
              coordinates: { latitude, longitude },
              radiusKm,
            }
          : undefined,
    },
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Get search suggestions for places
export async function getPlaceSearchSuggestionsAction(
  partialKeyword: string,
  regionId?: string,
) {
  if (!partialKeyword || partialKeyword.trim().length < 2) {
    return [];
  }

  const result = await getPlaceSearchSuggestions(
    context,
    partialKeyword.trim(),
    regionId,
  );

  if (result.isErr()) {
    return [];
  }

  return result.value;
}

// Search places by category
export async function searchPlacesByCategoryAction(
  regionId: string,
  category: string,
  userId?: string,
  limit = 20,
) {
  const categoryEnum = category as z.infer<typeof placeCategorySchema>;

  const result = await searchPlacesByCategory(
    context,
    regionId,
    categoryEnum,
    userId,
    limit,
  );

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Get place by ID
export async function getPlaceByIdAction(id: string, userId?: string) {
  const result = await context.placeRepository.findById(id, userId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  if (!result.value) {
    throw new Error("Place not found");
  }

  return result.value;
}
