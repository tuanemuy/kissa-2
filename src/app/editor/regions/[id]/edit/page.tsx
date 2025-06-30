import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserAction } from "@/actions/auth";
import { getRegionByIdAction } from "@/actions/region";
import { UserLayout } from "@/components/layout";
import { RegionForm } from "@/components/region/RegionForm";
import { Button } from "@/components/ui/button";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "地域を編集 - 編集者 - Kissa",
  description: "地域の情報を編集します",
};

interface EditRegionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRegionPage({ params }: EditRegionPageProps) {
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

  const { id } = await params;
  const { result: region, error: regionError } = await getRegionByIdAction(id);

  if (regionError || !region) {
    notFound();
  }

  return (
    <UserLayout>
      <RegionForm region={region} isEdit={true} />
    </UserLayout>
  );
}
