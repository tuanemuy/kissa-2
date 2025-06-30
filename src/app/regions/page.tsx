import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getFeaturedRegionsAction } from "@/actions/region";
import { PublicLayout } from "@/components/layout";
import { RegionList } from "@/components/region/RegionList";
import { RegionSearchForm } from "@/components/region/RegionSearchForm";

export const metadata: Metadata = {
  title: "地域一覧 - Kissa",
  description: "Kissaで様々な地域を探索し、お気に入りの場所を見つけましょう",
};

interface RegionsPageProps {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function RegionsPage({ searchParams }: RegionsPageProps) {
  const params = await searchParams;
  const keyword = params.keyword || "";
  const page = Number.parseInt(params.page || "1", 10);
  const limit = Number.parseInt(params.limit || "20", 10);

  return (
    <PublicLayout>
      <main className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">地域を探索</h1>
          <p className="text-muted-foreground text-lg">
            日本全国の魅力的な地域を発見し、お気に入りの場所を見つけましょう
          </p>
        </div>

        <div className="mb-8">
          <RegionSearchForm initialKeyword={keyword} />
        </div>

        {keyword ? (
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">「{keyword}」の検索結果</h2>
          </div>
        ) : null}

        <Suspense fallback={<RegionListSkeleton />}>
          <RegionList keyword={keyword} page={page} limit={limit} />
        </Suspense>

        {!keyword && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">注目の地域</h2>
            <Suspense fallback={<FeaturedRegionsSkeleton />}>
              <FeaturedRegions />
            </Suspense>
          </div>
        )}
      </main>
    </PublicLayout>
  );
}

async function FeaturedRegions() {
  const { result: featuredRegions } = await getFeaturedRegionsAction(6);

  if (!featuredRegions) {
    return <div>Featured regions not available</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {featuredRegions.map((region) => (
        <div
          key={region.id}
          className="bg-card rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          {region.coverImage && (
            <Image
              src={region.coverImage}
              alt={region.name}
              width={400}
              height={192}
              className="w-full h-48 object-cover rounded-md mb-4"
            />
          )}
          <h3 className="text-xl font-semibold mb-2">{region.name}</h3>
          {region.shortDescription && (
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {region.shortDescription}
            </p>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {region.placeCount}件の場所
            </span>
            <a
              href={`/regions/${region.id}`}
              className="text-primary hover:underline font-medium"
            >
              詳細を見る
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function RegionListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements don't reorder
          key={`regions-loading-${i}`}
          className="bg-card rounded-lg p-6"
        >
          <div className="w-full h-48 bg-muted rounded-md mb-4 animate-pulse" />
          <div className="h-6 bg-muted rounded mb-2 animate-pulse" />
          <div className="h-4 bg-muted rounded mb-4 animate-pulse" />
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturedRegionsSkeleton() {
  return <RegionListSkeleton />;
}
