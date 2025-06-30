import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getRegionByIdAction } from "@/actions/region";
import { AuthPrompt } from "@/components/auth/AuthPrompt";
import { PlaceList } from "@/components/place/PlaceList";
import { PlaceSearchResults } from "@/components/place/PlaceSearchResults";
import { FavoriteButton } from "@/components/region/FavoriteButton";
import { PinButton } from "@/components/region/PinButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { context } from "@/context";
import { getCurrentUser } from "@/core/application/user/sessionManagement";

interface RegionDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: RegionDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { result: region } = await getRegionByIdAction(id);

  if (!region) {
    return {
      title: "地域が見つかりません - Kissa",
    };
  }

  return {
    title: `${region.name} - Kissa`,
    description:
      region.shortDescription ||
      region.description ||
      `${region.name}の詳細情報`,
  };
}

export default async function RegionDetailPage({
  params,
}: RegionDetailPageProps) {
  const { id } = await params;
  const { result: region, error } = await getRegionByIdAction(id);

  if (error || !region) {
    notFound();
  }

  // Check authentication
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");
  let isAuthenticated = false;

  if (sessionToken?.value) {
    const userResult = await getCurrentUser(context, sessionToken.value);
    isAuthenticated = userResult.isOk() && !!userResult.value;
  }

  return (
    <main className="container mx-auto py-8">
      {/* Hero Section */}
      <div className="relative mb-8">
        {region.coverImage && (
          <div className="w-full h-64 md:h-96 relative rounded-lg overflow-hidden">
            <Image
              src={region.coverImage}
              alt={region.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {region.name}
              </h1>
              {region.shortDescription && (
                <p className="text-lg opacity-90">{region.shortDescription}</p>
              )}
            </div>
          </div>
        )}

        {!region.coverImage && (
          <div className="bg-muted rounded-lg p-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              {region.name}
            </h1>
            {region.shortDescription && (
              <p className="text-lg text-muted-foreground">
                {region.shortDescription}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {region.description && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">地域について</h2>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{region.description}</p>
              </div>
            </div>
          )}

          {/* Place Search */}
          <div className="mb-8">
            <PlaceSearchResults regionId={region.id} regionName={region.name} />
          </div>

          {/* Places in Region */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                この地域の場所 ({region.placeCount})
              </h2>
              <Button variant="outline" asChild>
                <a href={`/regions/${region.id}/places`}>すべて見る</a>
              </Button>
            </div>

            <Suspense fallback={<PlaceListSkeleton />}>
              <PlaceList regionId={region.id} limit={6} />
            </Suspense>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg p-6 sticky top-8">
            <h3 className="text-lg font-semibold mb-4">地域情報</h3>

            <div className="space-y-4">
              {region.address && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    所在地
                  </h4>
                  <p className="text-sm">{region.address}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">
                  場所数
                </h4>
                <p className="text-sm">{region.placeCount}件</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">
                  お気に入り
                </h4>
                <p className="text-sm">{region.favoriteCount}人</p>
              </div>

              {region.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    タグ
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {region.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              {isAuthenticated ? (
                <>
                  <FavoriteButton
                    regionId={region.id}
                    isAuthenticated={isAuthenticated}
                  />
                  <PinButton
                    regionId={region.id}
                    isAuthenticated={isAuthenticated}
                  />
                </>
              ) : (
                <AuthPrompt
                  title="この地域をもっと楽しむ"
                  description="アカウントを作成してお気に入りに追加しよう"
                  features={[
                    "地域をお気に入りに追加",
                    "地域をピン留めして素早くアクセス",
                    "場所にチェックイン",
                  ]}
                  variant="compact"
                  currentPath={`/regions/${region.id}`}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function PlaceListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements don't reorder
          key={`place-loading-${i}`}
          className="bg-card rounded-lg p-4"
        >
          <div className="w-full h-32 bg-muted rounded mb-3 animate-pulse" />
          <div className="h-5 bg-muted rounded mb-2 animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
