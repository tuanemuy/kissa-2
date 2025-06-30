"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ZodError, z } from "zod/v4";
import { context } from "@/context";
import {
  getUserPinnedRegions,
  type RegionPinApplicationError,
  reorderPinnedRegions,
  unpinRegion,
} from "@/core/application/region/managePins";
import {
  getCurrentUser,
  type SessionManagementError,
} from "@/core/application/user/sessionManagement";
import type { RegionWithStats } from "@/core/domain/region/types";
import type { ActionState } from "@/lib/actionState";
import {
  type ValidationError,
  ValidationError as ValidationErrorClass,
  validate,
} from "@/lib/validation";

// Get User Pinned Regions Action
export async function getUserPinnedRegionsAction(): Promise<
  ActionState<
    RegionWithStats[],
    RegionPinApplicationError | SessionManagementError
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

  const result = await getUserPinnedRegions(context, userResult.value.id);

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

// Unpin Region Action
export async function unpinRegionAction(
  regionId: string,
): Promise<
  ActionState<void, RegionPinApplicationError | SessionManagementError>
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

  const result = await unpinRegion(context, userResult.value.id, regionId);

  if (result.isErr()) {
    return {
      result: undefined,
      error: result.error,
    };
  }

  revalidatePath("/pinned");

  return {
    result: undefined,
    error: null,
  };
}

// Reorder Pinned Regions Action
const reorderPinnedRegionsSchema = z.object({
  regionIds: z.array(z.string().uuid()),
});

export async function reorderPinnedRegionsAction(
  prevState: ActionState<
    void,
    | ValidationError<z.infer<typeof reorderPinnedRegionsSchema>>
    | RegionPinApplicationError
    | SessionManagementError
  >,
  formData: FormData,
): Promise<
  ActionState<
    void,
    | ValidationError<z.infer<typeof reorderPinnedRegionsSchema>>
    | RegionPinApplicationError
    | SessionManagementError
  >
> {
  const regionIdsJson = formData.get("regionIds") as string;

  let regionIds: string[];
  try {
    regionIds = JSON.parse(regionIdsJson);
  } catch {
    return {
      result: prevState.result,
      error: new ValidationErrorClass(
        new ZodError([
          {
            code: "custom",
            path: ["regionIds"],
            message: "Invalid JSON format",
            input: regionIdsJson,
          },
        ]),
        "Invalid region IDs format",
      ) as ValidationError<{ regionIds: string[] }>,
    };
  }

  const validation = validate(reorderPinnedRegionsSchema, { regionIds });
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

  const result = await reorderPinnedRegions(context, {
    userId: userResult.value.id,
    regionIds: validation.value.regionIds,
  });

  if (result.isErr()) {
    return {
      result: undefined,
      error: result.error,
    };
  }

  revalidatePath("/pinned");

  return {
    result: undefined,
    error: null,
  };
}
