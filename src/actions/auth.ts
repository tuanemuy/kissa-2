"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import {
  authenticateUser,
  authenticateUserInputSchema,
} from "@/core/application/user/authenticateUser";
import {
  registerUser,
  registerUserInputSchema,
} from "@/core/application/user/registerUser";
import {
  requestPasswordReset,
  resetPassword,
} from "@/core/application/user/resetPassword";
import type { AuthFormState } from "@/lib/formState";
import { validate } from "@/lib/validation";
import { context } from "./context";

// Type definitions for form inputs
type LoginInput = { email: string; password: string };
type RegisterInput = { email: string; password: string; name: string; bio?: string };
type RequestResetInput = { email: string };
type ResetPasswordInput = { token: string; newPassword: string };

// Login action
export async function loginAction(
  _prevState: AuthFormState<LoginInput>,
  formData: FormData,
): Promise<AuthFormState<LoginInput>> {
  const input = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = validate(authenticateUserInputSchema, input);
  if (validation.isErr()) {
    return {
      input,
      error: validation.error,
    };
  }

  const result = await authenticateUser(context, validation.value);

  if (result.isErr()) {
    return {
      input,
      error: result.error,
    };
  }

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("session", result.value.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: result.value.expiresAt,
    path: "/",
  });

  // Redirect to dashboard
  redirect("/dashboard");
}

// Register action
export async function registerAction(
  _prevState: AuthFormState<RegisterInput>,
  formData: FormData,
): Promise<AuthFormState<RegisterInput>> {
  const input = {
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    bio: formData.get("bio") || undefined,
    avatar: formData.get("avatar") || undefined,
  };

  const validation = validate(registerUserInputSchema, input);
  if (validation.isErr()) {
    return {
      input,
      error: validation.error,
    };
  }

  const result = await registerUser(context, validation.value);

  if (result.isErr()) {
    return {
      input,
      error: result.error,
    };
  }

  return {
    input,
    result: result.value,
    error: null,
  };
}

// Request password reset action
const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export async function requestPasswordResetAction(
  _prevState: AuthFormState<RequestResetInput>,
  formData: FormData,
): Promise<AuthFormState<RequestResetInput>> {
  const input = {
    email: formData.get("email"),
  };

  const validation = validate(requestPasswordResetSchema, input);
  if (validation.isErr()) {
    return {
      input,
      error: validation.error,
    };
  }

  const result = await requestPasswordReset(context, validation.value);

  if (result.isErr()) {
    return {
      input,
      error: result.error,
    };
  }

  return {
    input,
    result: "Password reset email sent",
    error: null,
  };
}

// Reset password action
const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function resetPasswordAction(
  _prevState: AuthFormState<ResetPasswordInput>,
  formData: FormData,
): Promise<AuthFormState<ResetPasswordInput>> {
  const input = {
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
  };

  const validation = validate(resetPasswordSchema, input);
  if (validation.isErr()) {
    return {
      input,
      error: validation.error,
    };
  }

  const result = await resetPassword(context, validation.value);

  if (result.isErr()) {
    return {
      input,
      error: result.error,
    };
  }

  return {
    input,
    result: "Password reset successfully",
    error: null,
  };
}

// Logout action
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/");
}
