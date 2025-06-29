"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { registerAction } from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AuthFormState } from "@/lib/formState";

const registerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .max(128),
  name: z.string().min(1, "名前を入力してください").max(100),
  bio: z
    .string()
    .max(500, "自己紹介は500文字以内で入力してください")
    .optional(),
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [formState, formAction, isPending] = useActionState<AuthFormState<RegisterInput>>(registerAction, {
    input: { email: "", name: "", password: "", bio: "" },
    error: null,
  });

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: formState.input?.email || "",
      name: formState.input?.name || "",
      password: "",
      bio: formState.input?.bio || "",
    },
  });

  // Registration successful
  if (formState.result && !formState.error) {
    return (
      <>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-green-600">
            登録完了
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              アカウントの作成が完了しました。確認メールをお送りしましたのでご確認ください。
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
          新規登録
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
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={formState.input?.name || ""}
              className="mt-1"
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.name.message}
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

          <div>
            <Label htmlFor="bio">自己紹介（任意）</Label>
            <Textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={formState.input?.bio || ""}
              className="mt-1"
              placeholder="あなたについて簡単に教えてください..."
            />
            {form.formState.errors.bio && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.bio.message}
              </p>
            )}
          </div>

          {formState.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {typeof formState.error === 'object' && 'message' in formState.error 
                  ? formState.error.message 
                  : "登録に失敗しました"}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "登録中..." : "アカウントを作成"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">すでにアカウントをお持ちの方は </span>
          <Link
            href="/auth/login"
            className="text-blue-600 hover:text-blue-500"
          >
            ログイン
          </Link>
        </div>
      </CardContent>
    </>
  );
}
