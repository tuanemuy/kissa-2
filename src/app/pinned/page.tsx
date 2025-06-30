import { GripVertical, Pin, Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getUserPinnedRegionsAction } from "@/actions/pinned";
import { UserLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReorderablePinnedList } from "./ReorderablePinnedList";
import { UnpinButton } from "./UnpinButton";

export const metadata: Metadata = {
  title: "ピン留め地域 - Kissa",
  description: "ピン留めした地域の管理と並び替え",
};

export default async function PinnedPage() {
  const { result: pinnedRegions, error } = await getUserPinnedRegionsAction();

  if (error) {
    console.error("Failed to get pinned regions:", error);
  }

  const regions = pinnedRegions || [];

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">ピン留め地域</h1>
          <p className="text-muted-foreground">
            よく訪れる地域をピン留めして、すぐにアクセスできるようにしましょう。
            ドラッグ&ドロップで順序を変更できます。
          </p>
        </div>

        {/* Pinned Regions */}
        {regions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                ピン留め中の地域 ({regions.length})
              </h2>
              <Button variant="outline" asChild>
                <Link href="/regions">
                  <Plus className="h-4 w-4 mr-2" />
                  地域を探す
                </Link>
              </Button>
            </div>

            <ReorderablePinnedList regions={regions} />
          </div>
        )}
      </div>
    </UserLayout>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <Pin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            ピン留めした地域がありません
          </h3>
          <p className="text-muted-foreground mb-6">
            よく訪れる地域をピン留めして、簡単にアクセスできるようにしましょう。
            ピン留めした地域は上部に表示され、順序を自由に変更できます。
          </p>
          <Button asChild>
            <Link href="/regions">
              <Plus className="h-4 w-4 mr-2" />
              地域を探す
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PinnedRegionCard({
  region,
  isDragging = false,
}: {
  region: {
    id: string;
    name: string;
    description?: string;
    coverImage?: string;
    placeCount: number;
    favoriteCount: number;
    tags: string[];
    pinDisplayOrder?: number;
  };
  isDragging?: boolean;
}) {
  return (
    <Card className={`group ${isDragging ? "opacity-50" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{region.name}</CardTitle>
              {region.pinDisplayOrder !== undefined && (
                <p className="text-sm text-muted-foreground">
                  表示順序: {region.pinDisplayOrder + 1}
                </p>
              )}
            </div>
          </div>
          <UnpinButton regionId={region.id} regionName={region.name} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {region.coverImage && (
          <div className="relative h-32 w-full rounded-md overflow-hidden">
            <Image
              src={region.coverImage}
              alt={region.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        {region.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {region.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{region.placeCount}の場所</span>
          <span>{region.favoriteCount}人がお気に入り</span>
        </div>

        {region.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {region.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {region.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{region.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <Button asChild className="w-full" variant="outline">
          <Link href={`/regions/${region.id}`}>詳細を見る</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
