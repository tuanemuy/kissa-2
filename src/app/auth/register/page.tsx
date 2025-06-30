import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "新規登録 - Kissa",
  description: "Kissaに新規登録して地域探索を始めましょう",
};

export default function RegisterPage() {
  return (
    <main className="container mx-auto max-w-md py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">新規登録</h1>
        <p className="mt-2 text-muted-foreground">
          アカウントを作成してKissaを始めましょう
        </p>
      </div>

      <RegisterForm />

      <div className="mt-6 text-center text-sm">
        <p>
          すでにアカウントをお持ちですか？{" "}
          <a href="/auth/login" className="text-primary hover:underline">
            ログイン
          </a>
        </p>
      </div>
    </main>
  );
}
