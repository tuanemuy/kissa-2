"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { loginAction } from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "@/lib/formState";

const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [formState, formAction, isPending] = useActionState<AuthFormState<LoginInput>>(loginAction, {
    input: { email: "", password: "" },
    error: null,
  });

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: formState.input?.email || "",
      password: "",
    },
  });

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          ログイン
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={formState.input?.email || ""}
              className="mt-1"
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1"
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {formState.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {typeof formState.error === 'object' && 'message' in formState.error 
                  ? formState.error.message 
                  : "ログインに失敗しました"}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "ログイン中..." : "ログイン"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link
            href="/auth/reset-password"
            className="text-blue-600 hover:text-blue-500"
          >
            パスワードを忘れた方はこちら
          </Link>
        </div>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">アカウントをお持ちでない方は </span>
          <Link
            href="/auth/register"
            className="text-blue-600 hover:text-blue-500"
          >
            新規登録
          </Link>
        </div>
      </CardContent>
    </>
  );
}
