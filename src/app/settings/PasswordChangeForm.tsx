"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { changePasswordAction } from "@/actions/settings";
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
import type { ValidationError } from "@/lib/validation";

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
    newPassword: z
      .string()
      .min(8, "新しいパスワードは8文字以上である必要があります")
      .max(128, "新しいパスワードは128文字以内で入力してください"),
    confirmPassword: z.string().min(1, "パスワードの確認を入力してください"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordFormSchema>;

export function PasswordChangeForm() {
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [actionState, formAction, isPending] = useActionState(
    changePasswordAction,
    { result: undefined, error: null },
  );

  const onSubmit = (data: PasswordFormData) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("currentPassword", data.currentPassword);
      formData.append("newPassword", data.newPassword);

      formAction(formData);
    });
  };

  // Show success/error toasts based on action state
  if (actionState.error && isPending === false) {
    if (actionState.error.name === "ValidationError") {
      const validationError =
        actionState.error as ValidationError<PasswordFormData>;
      // Handle validation errors from the server
      if (validationError.error.issues) {
        for (const issue of validationError.error.issues) {
          const fieldName = issue.path[0] as keyof PasswordFormData;
          if (fieldName && issue.message) {
            form.setError(fieldName, {
              message: issue.message,
            });
          }
        }
      }
    } else if (actionState.error.message === "Current password is incorrect") {
      form.setError("currentPassword", {
        message: "現在のパスワードが正しくありません",
      });
    } else {
      toast.error("パスワードの変更に失敗しました。");
    }
  }

  if (
    !actionState.error &&
    isPending === false &&
    actionState.result !== undefined
  ) {
    toast.success("パスワードを変更しました。");
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>現在のパスワード</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="現在のパスワードを入力"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                セキュリティのため、現在のパスワードを入力してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>新しいパスワード</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="新しいパスワードを入力"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                8文字以上のパスワードを設定してください。
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
              <FormLabel>パスワードの確認</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="新しいパスワードを再入力"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                確認のため、新しいパスワードをもう一度入力してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ パスワードを変更すると、すべてのデバイスからログアウトされます。
          </p>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "変更中..." : "パスワードを変更"}
        </Button>
      </form>
    </Form>
  );
}
