"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { getCurrentUserAction } from "@/actions/auth";
import { context } from "@/context";
import {
  CreateRegionError,
  createRegion,
  createRegionInputSchema,
} from "@/core/application/region/createRegion";
import {
  getFeaturedRegions,
  getRegionsByCreator,
  listRegions,
} from "@/core/application/region/listRegions";
import {
  advancedSearchRegions,
  getRegionSearchSuggestions,
  type SearchRegionsError,
  searchRegions,
} from "@/core/application/region/searchRegions";
import {
  UpdateRegionError,
  updateRegion,
} from "@/core/application/region/updateRegion";
import {
  type ListRegionsQuery,
  type Region,
  type RegionWithStats,
  type SearchRegionsQuery,
  updateRegionSchema,
} from "@/core/domain/region/types";
import type { ActionState } from "@/lib/actionState";
import { type ValidationError, validate } from "@/lib/validation";

// Get region by ID
export async function getRegionByIdAction(
  id: string,
  userId?: string,
): Promise<ActionState<RegionWithStats | null>> {
  const result = await context.regionRepository.findById(id, userId);

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

// Entity-level data fetching for cache optimization
// Note: These actions fetch complete entities and will be cached later

// List regions
export async function listRegionsAction(
  query: ListRegionsQuery,
  userId?: string,
): Promise<
  ActionState<{
    items: RegionWithStats[];
    count: number;
    totalPages: number;
    currentPage: number;
  }>
> {
  const result = await listRegions(context, { query, userId });

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

// Get featured regions
export async function getFeaturedRegionsAction(
  limit = 10,
  userId?: string,
): Promise<ActionState<RegionWithStats[]>> {
  const result = await getFeaturedRegions(context, limit, userId);

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

// Search regions
export async function searchRegionsAction(
  query: SearchRegionsQuery,
  userId?: string,
): Promise<
  ActionState<{
    items: RegionWithStats[];
    count: number;
    totalPages: number;
    currentPage: number;
    searchTerm: string;
  }>
> {
  const result = await searchRegions(context, { query, userId });

  if (result.isErr()) {
    return {
      result: {
        items: [],
        count: 0,
        totalPages: 0,
        currentPage: 1,
        searchTerm: "",
      },
      error: result.error,
    };
  }

  return {
    result: result.value,
    error: null,
  };
}

// Get search suggestions
export async function getRegionSearchSuggestionsAction(
  partialKeyword: string,
  limit = 10,
): Promise<ActionState<string[]>> {
  const result = await getRegionSearchSuggestions(
    context,
    partialKeyword,
    limit,
  );

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

// Get regions by creator (for editor dashboard)
export async function getRegionsByCreatorAction(
  creatorId: string,
  status?: "draft" | "published" | "archived",
): Promise<ActionState<RegionWithStats[]>> {
  const result = await getRegionsByCreator(context, creatorId, status);

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

// Create region (editor only)
export async function createRegionAction(
  prevState: ActionState<
    Region,
    ValidationError<z.infer<typeof createRegionInputSchema>> | CreateRegionError
  >,
  formData: FormData,
): Promise<
  ActionState<
    Region,
    ValidationError<z.infer<typeof createRegionInputSchema>> | CreateRegionError
  >
> {
  const { result: user, error: userError } = await getCurrentUserAction();

  if (userError || !user) {
    return {
      result: prevState.result,
      error: new CreateRegionError("Authentication required"),
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
    coordinates,
    address: (formData.get("address") as string) || undefined,
    coverImage: (formData.get("coverImage") as string) || undefined,
    images,
    tags,
  };

  const validation = validate(createRegionInputSchema, input);
  if (validation.isErr()) {
    return {
      result: prevState.result,
      error: validation.error,
    };
  }

  const result = await createRegion(context, user.id, validation.value);

  if (result.isErr()) {
    return {
      result: prevState.result,
      error: result.error,
    };
  }

  revalidatePath("/editor/regions");
  revalidatePath("/regions");
  redirect(`/regions/${result.value.id}`);
}

// Update region (editor only)
export async function updateRegionAction(
  prevState: ActionState<
    Region,
    ValidationError<z.infer<typeof updateRegionSchema>> | UpdateRegionError
  >,
  formData: FormData,
): Promise<
  ActionState<
    Region,
    ValidationError<z.infer<typeof updateRegionSchema>> | UpdateRegionError
  >
> {
  const { result: user, error: userError } = await getCurrentUserAction();

  if (userError || !user) {
    return {
      result: prevState.result,
      error: new UpdateRegionError("Authentication required"),
    };
  }

  const regionId = formData.get("regionId") as string;

  if (!regionId) {
    return {
      result: prevState.result,
      error: new UpdateRegionError("Region ID is required"),
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
    coordinates,
    address: (formData.get("address") as string) || undefined,
    coverImage: (formData.get("coverImage") as string) || undefined,
    images,
    tags,
  };

  const validation = validate(updateRegionSchema, input);
  if (validation.isErr()) {
    return {
      result: prevState.result,
      error: validation.error,
    };
  }

  const result = await updateRegion(context, {
    regionId,
    userId: user.id,
    params: validation.value,
  });

  if (result.isErr()) {
    return {
      result: prevState.result,
      error: result.error,
    };
  }

  revalidatePath("/editor/regions");
  revalidatePath("/regions");
  revalidatePath(`/regions/${regionId}`);
  redirect(`/regions/${result.value.id}`);
}

// Simple search form action
const simpleSearchSchema = z.object({
  keyword: z.string().min(1),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function simpleSearchRegionsAction(
  prevState: ActionState<
    {
      items: RegionWithStats[];
      count: number;
      totalPages: number;
      currentPage: number;
      searchTerm: string;
    },
    ValidationError<z.infer<typeof simpleSearchSchema>> | SearchRegionsError
  >,
  formData: FormData,
): Promise<
  ActionState<
    {
      items: RegionWithStats[];
      count: number;
      totalPages: number;
      currentPage: number;
      searchTerm: string;
    },
    ValidationError<z.infer<typeof simpleSearchSchema>> | SearchRegionsError
  >
> {
  const input = {
    keyword: formData.get("keyword") as string,
    page: (formData.get("page") as string) || "1",
    limit: (formData.get("limit") as string) || "20",
  };

  const validation = validate(simpleSearchSchema, input);
  if (validation.isErr()) {
    return {
      result: prevState.result || {
        items: [],
        count: 0,
        totalPages: 0,
        currentPage: 1,
        searchTerm: "",
      },
      error: validation.error,
    };
  }

  const searchQuery: SearchRegionsQuery = {
    keyword: validation.value.keyword,
    pagination: {
      page: validation.value.page,
      limit: validation.value.limit,
      order: "desc",
      orderBy: "createdAt",
    },
  };

  const result = await searchRegions(context, { query: searchQuery });

  if (result.isErr()) {
    return {
      result: prevState.result || {
        items: [],
        count: 0,
        totalPages: 0,
        currentPage: 1,
        searchTerm: "",
      },
      error: result.error,
    };
  }

  return {
    result: result.value,
    error: null,
  };
}

// Advanced search with location filtering
export async function advancedSearchRegionsAction(
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
): Promise<
  ActionState<
    {
      items: RegionWithStats[];
      count: number;
      totalPages: number;
      currentPage: number;
      searchTerm: string;
    },
    SearchRegionsError
  >
> {
  const result = await advancedSearchRegions(context, filters, userId);

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
