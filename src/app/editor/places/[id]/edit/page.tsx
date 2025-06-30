import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserAction } from "@/actions/auth";
import { getPlaceByIdAction } from "@/actions/place";
import { listRegionsAction } from "@/actions/region";
import { UserLayout } from "@/components/layout";
import { PlaceForm } from "@/components/place/PlaceForm";
import { Button } from "@/components/ui/button";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "場所を編集 - 編集者 - Kissa",
  description: "場所の情報を編集します",
};

interface EditPlacePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlacePage({ params }: EditPlacePageProps) {
  const { result: user, error: userError } = await getCurrentUserAction();

  if (userError) {
    console.error("Failed to get current user:", userError);
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

  const { id: placeId } = await params;

  // Get place data
  const { result: place, error: placeError } = await getPlaceByIdAction(
    placeId,
    user.id,
  );

  if (placeError || !place) {
    notFound();
  }

  // Get regions for selection
  const { result: regionsData } = await listRegionsAction({
    filter: { status: "published" },
    pagination: { page: 1, limit: 100, order: "asc", orderBy: "name" },
  });

  const regions = regionsData?.items || [];

  return (
    <UserLayout>
      <PlaceForm place={place} regions={regions} isEdit={true} />
    </UserLayout>
  );
}
