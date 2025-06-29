"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const requestResetSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "リセットトークンが必要です"),
  newPassword: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .max(128),
});

type RequestResetInput = z.infer<typeof requestResetSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [requestFormState, requestFormAction, isRequestPending] =
    useActionState(requestPasswordResetAction, {
      input: { email: "" },
      error: null,
    });

  const [resetFormState, resetFormAction, isResetPending] = useActionState(
    resetPasswordAction,
    { input: { token: token || "", newPassword: "" }, error: null },
  );

  const requestForm = useForm<RequestResetInput>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: requestFormState.input?.email || "",
    },
  });

  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || "",
      newPassword: "",
    },
  });

  // If token is provided, show reset form
  if (token) {
    // Reset successful
    if (resetFormState.result && !resetFormState.error) {
      return (
        <>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              パスワードリセット完了
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                パスワードが正常にリセットされました。新しいパスワードでログインしてください。
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Link href="/auth/login">
                <Button>ログインページへ</Button>
              </Link>
            </div>
          </CardContent>
        </>
      );
    }

    return (
      <>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            新しいパスワードを設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={resetFormAction} className="space-y-6">
            <input type="hidden" name="token" value={token} />

            <div>
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="mt-1"
              />
              {resetForm.formState.errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            {resetFormState.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {resetFormState.error.message ||
                    "パスワードリセットに失敗しました"}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isResetPending}>
              {isResetPending ? "リセット中..." : "パスワードをリセット"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-500"
            >
              ログインページに戻る
            </Link>
          </div>
        </CardContent>
      </>
    );
  }

  // Request reset email sent
  if (requestFormState.result && !requestFormState.error) {
    return (
      <>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-green-600">
            リセットメール送信完了
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              パスワードリセット用のメールを送信しました。メールに記載されたリンクからパスワードをリセットしてください。
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Link href="/auth/login">
              <Button>ログインページへ</Button>
            </Link>
          </div>
        </CardContent>
      </>
    );
  }

  // Default: Show request reset form
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          パスワードリセット
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={requestFormAction} className="space-y-6">
          <p className="text-sm text-gray-600">
            登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
          </p>

          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={requestFormState.input?.email || ""}
              className="mt-1"
            />
            {requestForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {requestForm.formState.errors.email.message}
              </p>
            )}
          </div>

          {requestFormState.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {requestFormState.error.message ||
                  "リセットメールの送信に失敗しました"}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isRequestPending}>
            {isRequestPending ? "送信中..." : "リセットメールを送信"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link
            href="/auth/login"
            className="text-blue-600 hover:text-blue-500"
          >
            ログインページに戻る
          </Link>
        </div>
      </CardContent>
    </>
  );
}
