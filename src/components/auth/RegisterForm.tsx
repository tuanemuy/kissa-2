"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { registerAction } from "@/actions/auth";
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
import { Textarea } from "@/components/ui/textarea";

const registerSchema = z
  .object({
    email: z.string().email("有効なメールアドレスを入力してください"),
    password: z
      .string()
      .min(8, "パスワードは8文字以上で入力してください")
      .max(128, "パスワードは128文字以下で入力してください"),
    confirmPassword: z.string().min(1, "パスワードの確認を入力してください"),
    name: z
      .string()
      .min(1, "お名前を入力してください")
      .max(100, "お名前は100文字以下で入力してください"),
    bio: z
      .string()
      .max(500, "自己紹介は500文字以下で入力してください")
      .optional(),
    avatar: z
      .string()
      .url("有効なURLを入力してください")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      bio: "",
      avatar: "",
    },
  });

  const [actionState, formAction, isPending] = useActionState(registerAction, {
    result: undefined,
    error: null,
  });

  const onSubmit = (data: RegisterFormData) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("name", data.name);
      if (data.bio) formData.append("bio", data.bio);
      if (data.avatar) formData.append("avatar", data.avatar);
      formAction(formData);
    });
  };

  const hasError =
    actionState.error &&
    (actionState.error.name === "RegisterUserError" ||
      actionState.error.name === "ValidationError");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {hasError && (
          <Alert variant="destructive">
            <AlertDescription>
              {actionState.error?.name === "ValidationError"
                ? "入力内容に誤りがあります"
                : actionState.error?.message || "登録に失敗しました"}
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
                  placeholder="example@email.com"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>お名前</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="田中太郎"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="8文字以上のパスワード"
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
                  placeholder="パスワードを再度入力"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>自己紹介（任意）</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="地域探索が趣味です..."
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>最大500文字まで入力できます</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>アバター画像URL（任意）</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                プロフィール画像のURLを入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "登録中..." : "アカウントを作成"}
        </Button>
      </form>
    </Form>
  );
}
