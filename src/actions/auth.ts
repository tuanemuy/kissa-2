"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { context } from "@/context";
import {
  type AuthenticateUserError,
  authenticateUser,
  authenticateUserInputSchema,
} from "@/core/application/user/authenticateUser";
import {
  type RegisterUserError,
  registerUser,
  registerUserInputSchema,
} from "@/core/application/user/registerUser";
import {
  type PasswordResetApplicationError,
  requestPasswordReset,
  resetPassword,
} from "@/core/application/user/resetPassword";
import type { User } from "@/core/domain/user/types";
import type { ActionState } from "@/lib/actionState";
import { type ValidationError, validate } from "@/lib/validation";

// Login Action
export async function loginAction(
  prevState: ActionState<
    User,
    | ValidationError<z.infer<typeof authenticateUserInputSchema>>
    | AuthenticateUserError
  >,
  formData: FormData,
): Promise<
  ActionState<
    User,
    | ValidationError<z.infer<typeof authenticateUserInputSchema>>
    | AuthenticateUserError
  >
> {
  const input = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validation = validate(authenticateUserInputSchema, input);
  if (validation.isErr()) {
    return {
      result: prevState.result,
      error: validation.error,
    };
  }

  const result = await authenticateUser(context, validation.value);

  if (result.isErr()) {
    return {
      result: prevState.result,
      error: result.error,
    };
  }

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("session_token", result.value.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: result.value.expiresAt,
    path: "/",
  });

  revalidatePath("/");
  redirect("/dashboard");
}

// Register Action
export async function registerAction(
  prevState: ActionState<
    User,
    ValidationError<z.infer<typeof registerUserInputSchema>> | RegisterUserError
  >,
  formData: FormData,
): Promise<
  ActionState<
    User,
    ValidationError<z.infer<typeof registerUserInputSchema>> | RegisterUserError
  >
> {
  const input = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
    bio: (formData.get("bio") as string) || undefined,
    avatar: (formData.get("avatar") as string) || undefined,
  };

  const validation = validate(registerUserInputSchema, input);
  if (validation.isErr()) {
    return {
      result: prevState.result,
      error: validation.error,
    };
  }

  const result = await registerUser(context, validation.value);

  if (result.isErr()) {
    return {
      result: prevState.result,
      error: result.error,
    };
  }

  revalidatePath("/");
  redirect(
    "/auth/login?message=Registration successful. Please check your email for verification.",
  );
}

// Password Reset Request Action
const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export async function requestPasswordResetAction(
  prevState: ActionState<
    void,
    | ValidationError<z.infer<typeof requestPasswordResetSchema>>
    | PasswordResetApplicationError
  >,
  formData: FormData,
): Promise<
  ActionState<
    void,
    | ValidationError<z.infer<typeof requestPasswordResetSchema>>
    | PasswordResetApplicationError
  >
> {
  const input = {
    email: formData.get("email") as string,
  };

  const validation = validate(requestPasswordResetSchema, input);
  if (validation.isErr()) {
    return {
      result: prevState.result,
      error: validation.error,
    };
  }

  const result = await requestPasswordReset(context, validation.value);

  if (result.isErr()) {
    return {
      result: prevState.result,
      error: result.error,
    };
  }

  return {
    result: undefined,
    error: null,
  };
}

// Password Reset Action
const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function resetPasswordAction(
  prevState: ActionState<
    void,
    | ValidationError<z.infer<typeof resetPasswordSchema>>
    | PasswordResetApplicationError
  >,
  formData: FormData,
): Promise<
  ActionState<
    void,
    | ValidationError<z.infer<typeof resetPasswordSchema>>
    | PasswordResetApplicationError
  >
> {
  const input = {
    token: formData.get("token") as string,
    newPassword: formData.get("newPassword") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const validation = validate(resetPasswordSchema, input);
  if (validation.isErr()) {
    return {
      result: prevState.result,
      error: validation.error,
    };
  }

  const result = await resetPassword(context, {
    token: validation.value.token,
    newPassword: validation.value.newPassword,
  });

  if (result.isErr()) {
    return {
      result: prevState.result,
      error: result.error,
    };
  }

  revalidatePath("/");
  redirect(
    "/auth/login?message=Password reset successful. Please login with your new password.",
  );
}

// Logout Action
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");

  revalidatePath("/");
  redirect("/");
}
