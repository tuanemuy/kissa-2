"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { context } from "@/context";
import {
  addPlaceToFavorites,
  getUserFavoritePlaces,
  type PlaceFavoriteApplicationError,
  removePlaceFromFavorites,
} from "@/core/application/place/manageFavorites";
import {
  addRegionToFavorites,
  getUserFavoriteRegions,
  type RegionFavoriteApplicationError,
  removeRegionFromFavorites,
} from "@/core/application/region/manageFavorites";
import {
  getCurrentUser,
  type SessionManagementError,
} from "@/core/application/user/sessionManagement";
import type { PlaceWithStats } from "@/core/domain/place/types";
import type { RegionWithStats } from "@/core/domain/region/types";
import type { ActionState } from "@/lib/actionState";

// Get User Favorite Regions Action
export async function getUserFavoriteRegionsAction(): Promise<
  ActionState<
    RegionWithStats[],
    RegionFavoriteApplicationError | SessionManagementError
  >
> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");

  if (!sessionToken?.value) {
    return {
      result: [],
      error: null,
    };
  }

  const userResult = await getCurrentUser(context, sessionToken.value);
  if (userResult.isErr()) {
    return {
      result: [],
      error: userResult.error,
    };
  }

  if (!userResult.value) {
    return {
      result: [],
      error: null,
    };
  }

  const result = await getUserFavoriteRegions(context, userResult.value.id);

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

// Get User Favorite Places Action
export async function getUserFavoritePlacesAction(): Promise<
  ActionState<
    PlaceWithStats[],
    PlaceFavoriteApplicationError | SessionManagementError
  >
> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");

  if (!sessionToken?.value) {
    return {
      result: [],
      error: null,
    };
  }

  const userResult = await getCurrentUser(context, sessionToken.value);
  if (userResult.isErr()) {
    return {
      result: [],
      error: userResult.error,
    };
  }

  if (!userResult.value) {
    return {
      result: [],
      error: null,
    };
  }

  const result = await getUserFavoritePlaces(context, userResult.value.id);

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

// Remove Region from Favorites Action
export async function removeRegionFromFavoritesAction(
  regionId: string,
): Promise<
  ActionState<void, RegionFavoriteApplicationError | SessionManagementError>
> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");

  if (!sessionToken?.value) {
    return {
      result: undefined,
      error: null,
    };
  }

  const userResult = await getCurrentUser(context, sessionToken.value);
  if (userResult.isErr()) {
    return {
      result: undefined,
      error: userResult.error,
    };
  }

  if (!userResult.value) {
    return {
      result: undefined,
      error: null,
    };
  }

  const result = await removeRegionFromFavorites(
    context,
    userResult.value.id,
    regionId,
  );

  if (result.isErr()) {
    return {
      result: undefined,
      error: result.error,
    };
  }

  revalidatePath("/favorites");

  return {
    result: undefined,
    error: null,
  };
}

// Remove Place from Favorites Action
export async function removePlaceFromFavoritesAction(
  placeId: string,
): Promise<
  ActionState<void, PlaceFavoriteApplicationError | SessionManagementError>
> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");

  if (!sessionToken?.value) {
    return {
      result: undefined,
      error: null,
    };
  }

  const userResult = await getCurrentUser(context, sessionToken.value);
  if (userResult.isErr()) {
    return {
      result: undefined,
      error: userResult.error,
    };
  }

  if (!userResult.value) {
    return {
      result: undefined,
      error: null,
    };
  }

  const result = await removePlaceFromFavorites(
    context,
    userResult.value.id,
    placeId,
  );

  if (result.isErr()) {
    return {
      result: undefined,
      error: result.error,
    };
  }

  revalidatePath("/favorites");

  return {
    result: undefined,
    error: null,
  };
}

// Add Region to Favorites Action
export async function addRegionToFavoritesAction(
  regionId: string,
): Promise<
  ActionState<void, RegionFavoriteApplicationError | SessionManagementError>
> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");

  if (!sessionToken?.value) {
    return {
      result: undefined,
      error: null,
    };
  }

  const userResult = await getCurrentUser(context, sessionToken.value);
  if (userResult.isErr()) {
    return {
      result: undefined,
      error: userResult.error,
    };
  }

  if (!userResult.value) {
    return {
      result: undefined,
      error: null,
    };
  }

  const result = await addRegionToFavorites(context, {
    userId: userResult.value.id,
    regionId,
  });

  if (result.isErr()) {
    return {
      result: undefined,
      error: result.error,
    };
  }

  revalidatePath("/favorites");
  revalidatePath(`/regions/${regionId}`);

  return {
    result: undefined,
    error: null,
  };
}

// Add Place to Favorites Action
export async function addPlaceToFavoritesAction(
  placeId: string,
): Promise<
  ActionState<void, PlaceFavoriteApplicationError | SessionManagementError>
> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");

  if (!sessionToken?.value) {
    return {
      result: undefined,
      error: null,
    };
  }

  const userResult = await getCurrentUser(context, sessionToken.value);
  if (userResult.isErr()) {
    return {
      result: undefined,
      error: userResult.error,
    };
  }

  if (!userResult.value) {
    return {
      result: undefined,
      error: null,
    };
  }

  const result = await addPlaceToFavorites(context, {
    userId: userResult.value.id,
    placeId,
  });

  if (result.isErr()) {
    return {
      result: undefined,
      error: result.error,
    };
  }

  revalidatePath("/favorites");
  revalidatePath(`/places/${placeId}`);

  return {
    result: undefined,
    error: null,
  };
}
