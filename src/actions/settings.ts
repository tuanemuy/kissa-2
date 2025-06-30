"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { z } from "zod/v4";
import { context } from "@/context";
import {
  getCurrentUser,
  type SessionManagementError,
} from "@/core/application/user/sessionManagement";
import {
  changePasswordInputSchema,
  changeUserPassword,
  getUserProfile,
  type UserProfileManagementError,
  updateUserProfile,
  updateUserProfileInputSchema,
} from "@/core/application/user/userProfileManagement";
import type { User } from "@/core/domain/user/types";
import type { ActionState } from "@/lib/actionState";
import { type ValidationError, validate } from "@/lib/validation";

// Get User Profile Action
export async function getUserProfileAction(): Promise<
  ActionState<User, UserProfileManagementError | SessionManagementError>
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

  const profileResult = await getUserProfile(context, userResult.value.id);

  if (profileResult.isErr()) {
    return {
      result: undefined,
      error: profileResult.error,
    };
  }

  return {
    result: profileResult.value,
    error: null,
  };
}

// Update User Profile Action
export async function updateUserProfileAction(
  prevState: ActionState<
    User,
    | ValidationError<z.infer<typeof updateUserProfileInputSchema>>
    | UserProfileManagementError
    | SessionManagementError
  >,
  formData: FormData,
): Promise<
  ActionState<
    User,
    | ValidationError<z.infer<typeof updateUserProfileInputSchema>>
    | UserProfileManagementError
    | SessionManagementError
  >
> {
  const input = {
    name: (formData.get("name") as string) || undefined,
    bio: (formData.get("bio") as string) || undefined,
    avatar: (formData.get("avatar") as string) || undefined,
  };

  const validation = validate(updateUserProfileInputSchema, input);
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

  const updateResult = await updateUserProfile(
    context,
    userResult.value.id,
    validation.value,
  );

  if (updateResult.isErr()) {
    return {
      result: prevState.result,
      error: updateResult.error,
    };
  }

  revalidatePath("/settings");

  return {
    result: updateResult.value,
    error: null,
  };
}

// Change Password Action
export async function changePasswordAction(
  prevState: ActionState<
    void,
    | ValidationError<z.infer<typeof changePasswordInputSchema>>
    | UserProfileManagementError
    | SessionManagementError
  >,
  formData: FormData,
): Promise<
  ActionState<
    void,
    | ValidationError<z.infer<typeof changePasswordInputSchema>>
    | UserProfileManagementError
    | SessionManagementError
  >
> {
  const input = {
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
  };

  const validation = validate(changePasswordInputSchema, input);
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

  const changeResult = await changeUserPassword(
    context,
    userResult.value.id,
    validation.value,
  );

  if (changeResult.isErr()) {
    return {
      result: prevState.result,
      error: changeResult.error,
    };
  }

  return {
    result: undefined,
    error: null,
  };
}
