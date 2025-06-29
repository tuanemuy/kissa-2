"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import {
  getUserPinnedRegions,
  pinRegion,
  reorderPinnedRegions,
  unpinRegion,
} from "@/core/application/region/managePins";
import type { FormState } from "@/lib/formState";
import { validate } from "@/lib/validation";
import { context } from "./context";

// Pin region
const pinRegionSchema = z.object({
  userId: z.string().uuid(),
  regionId: z.string().uuid(),
});

export async function pinRegionAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const input = {
    userId: formData.get("userId"),
    regionId: formData.get("regionId"),
  };

  const validation = validate(pinRegionSchema, input);
  if (validation.isErr()) {
    return {
      input,
      error: validation.error,
    };
  }

  const result = await pinRegion(context, validation.value);

  if (result.isErr()) {
    return {
      input,
      error: result.error,
    };
  }

  revalidatePath("/pinned");
  revalidatePath("/dashboard");
  revalidatePath(`/regions/${validation.value.regionId}`);

  return {
    input,
    result: result.value,
    error: null,
  };
}

// Unpin region
export async function unpinRegionAction(userId: string, regionId: string) {
  const result = await unpinRegion(context, userId, regionId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  revalidatePath("/pinned");
  revalidatePath("/dashboard");
  revalidatePath(`/regions/${regionId}`);

  return result.value;
}

// Get user's pinned regions
export async function getUserPinnedRegionsAction(userId: string) {
  const result = await getUserPinnedRegions(context, userId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Reorder pinned regions
const reorderPinnedRegionsSchema = z.object({
  userId: z.string().uuid(),
  regionIds: z.array(z.string().uuid()),
});

export async function reorderPinnedRegionsAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const input = {
    userId: formData.get("userId"),
    regionIds: JSON.parse((formData.get("regionIds") as string) || "[]"),
  };

  const validation = validate(reorderPinnedRegionsSchema, input);
  if (validation.isErr()) {
    return {
      input,
      error: validation.error,
    };
  }

  const result = await reorderPinnedRegions(context, validation.value);

  if (result.isErr()) {
    return {
      input,
      error: result.error,
    };
  }

  revalidatePath("/pinned");
  revalidatePath("/dashboard");

  return {
    input,
    result: "Reordered successfully",
    error: null,
  };
}
