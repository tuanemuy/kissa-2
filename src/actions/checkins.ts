"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { z } from "zod/v4";
import { context } from "@/context";
import {
  type CreateCheckinError,
  createCheckin,
  createCheckinInputSchema,
} from "@/core/application/checkin/createCheckin";
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
import { type ValidationError, validate } from "@/lib/validation";

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

// Create Checkin Action
export async function createCheckinAction(
  prevState: ActionState<
    void,
    | ValidationError<z.infer<typeof createCheckinInputSchema>>
    | CreateCheckinError
    | SessionManagementError
  >,
  formData: FormData,
): Promise<
  ActionState<
    void,
    | ValidationError<z.infer<typeof createCheckinInputSchema>>
    | CreateCheckinError
    | SessionManagementError
  >
> {
  // Process photos from form data
  const photos = [];
  let photoIndex = 0;
  while (formData.has(`photos[${photoIndex}][url]`)) {
    const url = formData.get(`photos[${photoIndex}][url]`) as string;
    const caption = formData.get(`photos[${photoIndex}][caption]`) as string;

    if (url) {
      photos.push({
        url,
        caption: caption || undefined,
      });
    }
    photoIndex++;
  }

  const input = {
    placeId: formData.get("placeId") as string,
    comment: (formData.get("comment") as string) || undefined,
    rating: formData.get("rating")
      ? Number.parseInt(formData.get("rating") as string, 10)
      : undefined,
    userLocation: {
      latitude: Number.parseFloat(formData.get("latitude") as string),
      longitude: Number.parseFloat(formData.get("longitude") as string),
    },
    isPrivate: formData.get("isPrivate") === "true",
    photos,
  };

  const validation = validate(createCheckinInputSchema, input);
  if (validation.isErr()) {
    return {
      result: prevState.result,
      error: validation.error,
    };
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");

  if (!sessionToken?.value) {
    return {
      result: prevState.result,
      error: null,
    };
  }

  const userResult = await getCurrentUser(context, sessionToken.value);
  if (userResult.isErr()) {
    return {
      result: prevState.result,
      error: userResult.error,
    };
  }

  if (!userResult.value) {
    return {
      result: prevState.result,
      error: null,
    };
  }

  const checkinResult = await createCheckin(
    context,
    userResult.value.id,
    validation.value,
  );

  if (checkinResult.isErr()) {
    return {
      result: prevState.result,
      error: checkinResult.error,
    };
  }

  revalidatePath("/checkins");
  revalidatePath(`/places/${input.placeId}`);

  return {
    result: undefined,
    error: null,
  };
}
