import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { listRegionsAction } from "@/actions/region";
import { UserLayout } from "@/components/layout";
import { PlaceForm } from "@/components/place/PlaceForm";
import { Button } from "@/components/ui/button";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "新しい場所を作成 - 編集者 - Kissa",
  description: "新しい場所を作成します",
};

export default async function CreatePlacePage() {
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

  // Get regions for selection
  const { result: regionsData } = await listRegionsAction({
    filter: { status: "published" },
    pagination: { page: 1, limit: 100, order: "asc", orderBy: "name" },
  });

  const regions = regionsData?.items || [];

  return (
    <UserLayout>
      <PlaceForm regions={regions} />
    </UserLayout>
  );
}
