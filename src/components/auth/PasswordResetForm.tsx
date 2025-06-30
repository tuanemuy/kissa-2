"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const requestResetSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "トークンが必要です"),
    newPassword: z
      .string()
      .min(8, "パスワードは8文字以上で入力してください")
      .max(128, "パスワードは128文字以下で入力してください"),
    confirmPassword: z.string().min(1, "パスワードの確認を入力してください"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type RequestResetFormData = z.infer<typeof requestResetSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function PasswordResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Show reset form if token is present, otherwise show request form
  return token ? (
    <ResetPasswordForm token={token} />
  ) : (
    <RequestPasswordResetForm />
  );
}

function RequestPasswordResetForm() {
  const form = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const [actionState, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    { result: undefined, error: null },
  );

  const onSubmit = (data: RequestResetFormData) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("email", data.email);
      formAction(formData);
    });
  };

  const hasError = actionState.error;
  const isSuccess = !hasError && actionState.result !== null;

  if (isSuccess) {
    return (
      <Alert>
        <AlertDescription>
          パスワードリセットのメールを送信しました。
          メールに記載されたリンクからパスワードをリセットしてください。
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {hasError && (
          <Alert variant="destructive">
            <AlertDescription>
              {actionState.error?.name === "ValidationError"
                ? "入力内容に誤りがあります"
                : actionState.error?.message || "リセット要求に失敗しました"}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="登録済みのメールアドレス"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                登録済みのメールアドレスを入力してください。
                パスワードリセット用のリンクをお送りします。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "送信中..." : "リセットメールを送信"}
        </Button>
      </form>
    </Form>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [actionState, formAction, isPending] = useActionState(
    resetPasswordAction,
    { result: undefined, error: null },
  );

  const onSubmit = (data: ResetPasswordFormData) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("token", data.token);
      formData.append("newPassword", data.newPassword);
      formData.append("confirmPassword", data.confirmPassword);
      formAction(formData);
    });
  };

  const hasError = actionState.error;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {hasError && (
          <Alert variant="destructive">
            <AlertDescription>
              {actionState.error?.name === "ValidationError"
                ? "入力内容に誤りがあります"
                : actionState.error?.message ||
                  "パスワードリセットに失敗しました"}
            </AlertDescription>
          </Alert>
        )}

        <input type="hidden" value={token} {...form.register("token")} />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>新しいパスワード</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="8文字以上の新しいパスワード"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                8文字以上、128文字以下で入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード（確認）</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="新しいパスワードを再度入力"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "更新中..." : "パスワードを更新"}
        </Button>
      </form>
    </Form>
  );
}
