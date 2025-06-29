"use server";

import { z } from "zod/v4";
import {
  getFeaturedRegions,
  listRegions,
} from "@/core/application/region/listRegions";
import {
  getRegionSearchSuggestions,
  searchRegions,
} from "@/core/application/region/searchRegions";
import { validate } from "@/lib/validation";
import { context } from "./context";

// Get featured regions for homepage
export async function getFeaturedRegionsAction(limit = 10) {
  const result = await getFeaturedRegions(context, limit);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// List regions with optional filters
const listRegionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  orderBy: z
    .enum(["createdAt", "updatedAt", "name", "visitCount"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum(["published", "draft", "archived"]).optional(),
});

export async function listRegionsAction(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const validation = validate(listRegionsSchema, searchParams);

  if (validation.isErr()) {
    throw new Error("Invalid parameters");
  }

  const { page, limit, orderBy, order, status } = validation.value;

  const result = await listRegions(context, {
    query: {
      pagination: {
        page,
        limit,
        orderBy,
        order,
      },
      filter: status ? { status } : undefined,
    },
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Search regions by keyword
const searchRegionsSchema = z.object({
  keyword: z.string().min(1),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(1).max(100).default(10),
});

export async function searchRegionsAction(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const validation = validate(searchRegionsSchema, searchParams);

  if (validation.isErr()) {
    throw new Error("Invalid search parameters");
  }

  const { keyword, page, limit, latitude, longitude, radiusKm } =
    validation.value;

  const result = await searchRegions(context, {
    query: {
      keyword,
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

// Get search suggestions
export async function getSearchSuggestionsAction(partialKeyword: string) {
  if (!partialKeyword || partialKeyword.trim().length < 2) {
    return [];
  }

  const result = await getRegionSearchSuggestions(
    context,
    partialKeyword.trim(),
  );

  if (result.isErr()) {
    return [];
  }

  return result.value;
}

// Get region by ID
export async function getRegionByIdAction(id: string, userId?: string) {
  const result = await context.regionRepository.findById(id, userId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  if (!result.value) {
    throw new Error("Region not found");
  }

  return result.value;
}
