import type { Metadata } from "next";
import { Suspense } from "react";
import { PasswordResetForm } from "@/components/auth/PasswordResetForm";

export const metadata: Metadata = {
  title: "パスワードリセット - Kissa",
  description: "パスワードをリセットしてアカウントにアクセスしましょう",
};

export default function ResetPasswordPage() {
  return (
    <main className="container mx-auto max-w-md py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">パスワードリセット</h1>
        <p className="mt-2 text-muted-foreground">
          登録済みのメールアドレスを入力してください
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <PasswordResetForm />
      </Suspense>

      <div className="mt-6 text-center text-sm">
        <p>
          ログインページに戻る{" "}
          <a href="/auth/login" className="text-primary hover:underline">
            ログイン
          </a>
        </p>
      </div>
    </main>
  );
}
