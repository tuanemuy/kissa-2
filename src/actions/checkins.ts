"use server";

import { cookies } from "next/headers";
import { context } from "@/context";
import {
  getCheckinDetails,
  type ListUserCheckinsError,
  listUserCheckins,
} from "@/core/application/checkin/listUserCheckins";
import {
  getCurrentUser,
  type SessionManagementError,
} from "@/core/application/user/sessionManagement";
import type { CheckinWithDetails } from "@/core/domain/checkin/types";
import type { ActionState } from "@/lib/actionState";

export interface CheckinWithPlace
  extends Omit<CheckinWithDetails, "placeName"> {
  placeName?: string;
  placeCategory?: string;
  regionName?: string;
}

// Get User Checkins Action
export async function getUserCheckinsAction(
  limit = 20,
): Promise<
  ActionState<
    CheckinWithPlace[],
    ListUserCheckinsError | SessionManagementError
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

  const result = await listUserCheckins(context, {
    userId: userResult.value.id,
    limit,
  });

  if (result.isErr()) {
    return {
      result: [],
      error: result.error,
    };
  }

  // Enhance checkins with place information
  const enhancedCheckins: CheckinWithPlace[] = await Promise.all(
    result.value.map(async (checkin) => {
      try {
        const placeResult = await context.placeRepository.findById(
          checkin.placeId,
        );
        if (placeResult.isOk() && placeResult.value) {
          const place = placeResult.value;

          // Get region information if available
          let regionName: string | undefined;
          if (place.regionId) {
            const regionResult = await context.regionRepository.findById(
              place.regionId,
            );
            if (regionResult.isOk() && regionResult.value) {
              regionName = regionResult.value.name;
            }
          }

          return {
            ...checkin,
            placeName: place.name,
            placeCategory: place.category,
            regionName,
          };
        }
      } catch (error) {
        console.error("Failed to enhance checkin with place info:", error);
      }

      return checkin;
    }),
  );

  return {
    result: enhancedCheckins,
    error: null,
  };
}

// Get Checkin Details Action
export async function getCheckinDetailsAction(
  checkinId: string,
): Promise<
  ActionState<CheckinWithPlace, ListUserCheckinsError | SessionManagementError>
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

  const result = await getCheckinDetails(
    context,
    checkinId,
    userResult.value.id,
  );

  if (result.isErr()) {
    return {
      result: undefined,
      error: result.error,
    };
  }

  // Enhance checkin with place information
  let enhancedCheckin: CheckinWithPlace = result.value;
  try {
    const placeResult = await context.placeRepository.findById(
      result.value.placeId,
    );
    if (placeResult.isOk() && placeResult.value) {
      const place = placeResult.value;

      // Get region information if available
      let regionName: string | undefined;
      if (place.regionId) {
        const regionResult = await context.regionRepository.findById(
          place.regionId,
        );
        if (regionResult.isOk() && regionResult.value) {
          regionName = regionResult.value.name;
        }
      }

      enhancedCheckin = {
        ...result.value,
        placeName: place.name,
        placeCategory: place.category,
        regionName,
      };
    }
  } catch (error) {
    console.error("Failed to enhance checkin with place info:", error);
  }

  return {
    result: enhancedCheckin,
    error: null,
  };
}
