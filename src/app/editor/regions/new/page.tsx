import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { UserLayout } from "@/components/layout";
import { RegionForm } from "@/components/region/RegionForm";
import { Button } from "@/components/ui/button";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "新しい地域を作成 - 編集者 - Kissa",
  description: "新しい地域を作成します",
};

export default async function CreateRegionPage() {
  const { result: user, error } = await getCurrentUserAction();

  if (error) {
    console.error("Failed to get current user:", error);
  }

  if (!user || !UserDomain.hasMinimumRole(user, "editor")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">アクセス権限がありません</h1>
          <p className="text-muted-foreground mb-4">
            このページにアクセスするには編集者権限が必要です。
          </p>
          <Button asChild>
            <Link href="/dashboard">ダッシュボードに戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <UserLayout>
      <RegionForm />
    </UserLayout>
  );
}
