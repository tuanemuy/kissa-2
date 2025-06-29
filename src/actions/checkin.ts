"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCheckin,
  createCheckinInputSchema,
} from "@/core/application/checkin/createCheckin";
import { getCurrentUser } from "@/lib/auth";
import type { FormState } from "@/lib/formState";
import { validate } from "@/lib/validation";
import { context } from "./context";

// Create checkin
export async function createCheckinAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      redirect("/auth/login");
    }

    const input = {
      placeId: formData.get("placeId"),
      comment: formData.get("comment") || undefined,
      rating: formData.get("rating")
        ? Number(formData.get("rating"))
        : undefined,
      userLocation: {
        latitude: Number(formData.get("latitude")),
        longitude: Number(formData.get("longitude")),
      },
      isPrivate: formData.get("isPrivate") === "true",
      photos: JSON.parse((formData.get("photos") as string) || "[]"),
    };

    const validation = validate(createCheckinInputSchema, input);
    if (validation.isErr()) {
      return {
        input,
        error: validation.error,
      };
    }

    const result = await createCheckin(context, user.id, validation.value);

    if (result.isErr()) {
      return {
        input,
        error: result.error,
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/checkins");
    revalidatePath(`/places/${validation.value.placeId}`);

    return {
      input,
      result: result.value,
      error: null,
    };
  } catch (_error) {
    return {
      input: {},
      error: { message: "Unexpected error occurred" },
    };
  }
}

// Get user's checkins
export async function getUserCheckinsAction(userId: string, limit?: number) {
  const result = await context.checkinRepository.getByUser(userId, limit);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Get user's recent checkins
export async function getUserRecentCheckinsAction(userId: string, limit = 10) {
  const result = await context.checkinRepository.getRecentByUser(userId, limit);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Get checkin by ID
export async function getCheckinByIdAction(id: string) {
  const result = await context.checkinRepository.findById(id);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  if (!result.value) {
    throw new Error("Checkin not found");
  }

  return result.value;
}

// Get checkins for a place
export async function getPlaceCheckinsAction(placeId: string, limit?: number) {
  const result = await context.checkinRepository.getByPlace(placeId, limit);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Get user's checkin stats
export async function getUserCheckinStatsAction(userId: string) {
  const result = await context.checkinRepository.getUserStats(userId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}
