import Image from "next/image";
import { Suspense } from "react";
import { getFeaturedRegionsAction } from "@/actions/region";
import { FeatureShowcase } from "@/components/home/FeatureShowcase";
import { HeroSection } from "@/components/home/HeroSection";
import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <PublicLayout>
      <HeroSection />

      {/* Featured Regions */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">注目の地域</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              人気の高い地域から探索を始めてみませんか？
            </p>
          </div>

          <Suspense fallback={<FeaturedRegionsSkeleton />}>
            <FeaturedRegionsGrid />
          </Suspense>

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <a href="/regions">すべての地域を見る</a>
            </Button>
          </div>
        </div>
      </section>

      <FeatureShowcase />
    </PublicLayout>
  );
}

async function FeaturedRegionsGrid() {
  const { result: featuredRegions } = await getFeaturedRegionsAction(6);

  if (!featuredRegions) {
    return <div>Featured regions not available</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {featuredRegions.map((region) => (
        <a
          key={region.id}
          href={`/regions/${region.id}`}
          className="group bg-card rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          {region.coverImage && (
            <Image
              src={region.coverImage}
              alt={region.name}
              width={400}
              height={192}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
            />
          )}
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
              {region.name}
            </h3>
            {region.shortDescription && (
              <p className="text-muted-foreground mb-4 line-clamp-2">
                {region.shortDescription}
              </p>
            )}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{region.placeCount}件の場所</span>
              <span>{region.favoriteCount}人がお気に入り</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function FeaturedRegionsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements don't reorder
          key={`featured-skeleton-${i}`}
          className="bg-card rounded-lg overflow-hidden"
        >
          <div className="w-full h-48 bg-muted animate-pulse" />
          <div className="p-6">
            <div className="h-6 bg-muted rounded mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded mb-4 animate-pulse" />
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
