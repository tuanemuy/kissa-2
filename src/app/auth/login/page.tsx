import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "ログイン - Kissa",
  description: "Kissaにログインしてお気に入りの地域や場所を管理しましょう",
};

export default function LoginPage() {
  return (
    <main className="container mx-auto max-w-md py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">ログイン</h1>
        <p className="mt-2 text-muted-foreground">
          アカウントにログインしてください
        </p>
      </div>

      <LoginForm />

      <div className="mt-6 text-center text-sm">
        <p>
          アカウントをお持ちでないですか？{" "}
          <a href="/auth/register" className="text-primary hover:underline">
            新規登録
          </a>
        </p>
        <p className="mt-2">
          <a
            href="/auth/reset-password"
            className="text-primary hover:underline"
          >
            パスワードをお忘れですか？
          </a>
        </p>
      </div>
    </main>
  );
}
