"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { updateUserProfileAction } from "@/actions/settings";
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
import type { User } from "@/core/domain/user/types";
import type { ValidationError } from "@/lib/validation";

const profileFormSchema = z.object({
  name: z
    .string()
    .min(1, "名前は必須です")
    .max(100, "名前は100文字以内で入力してください"),
  bio: z
    .string()
    .max(500, "自己紹介は500文字以内で入力してください")
    .optional(),
  avatar: z
    .string()
    .url("有効なURLを入力してください")
    .optional()
    .or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio || "",
      avatar: user.avatar || "",
    },
  });

  const [actionState, formAction, isPending] = useActionState(
    updateUserProfileAction,
    { result: user, error: null },
  );

  const onSubmit = (data: ProfileFormData) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.bio) formData.append("bio", data.bio);
      if (data.avatar) formData.append("avatar", data.avatar);

      formAction(formData);
    });
  };

  // Show success/error toasts based on action state
  if (actionState.error && isPending === false) {
    if (actionState.error.name === "ValidationError") {
      const validationError =
        actionState.error as ValidationError<ProfileFormData>;
      // Handle validation errors from the server
      if (validationError.error.issues) {
        for (const issue of validationError.error.issues) {
          const fieldName = issue.path[0] as keyof ProfileFormData;
          if (fieldName && issue.message) {
            form.setError(fieldName, {
              message: issue.message,
            });
          }
        }
      }
    } else {
      toast.error("プロフィールの更新に失敗しました。");
    }
  }

  if (actionState.result && !actionState.error && isPending === false) {
    toast.success("プロフィールを更新しました。");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名前</FormLabel>
              <FormControl>
                <Input placeholder="あなたの名前" {...field} />
              </FormControl>
              <FormDescription>
                公開プロフィールに表示される名前です。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>自己紹介</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="あなたについて簡単に教えてください"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                500文字以内であなたの自己紹介を書いてください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>アバター画像URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/avatar.jpg"
                  type="url"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                プロフィール画像のURLを入力してください。空白の場合はデフォルト画像が使用されます。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "更新中..." : "プロフィールを更新"}
        </Button>
      </form>
    </Form>
  );
}
