import Image from "next/image";
import { Suspense } from "react";
import { getFeaturedRegionsAction } from "@/actions/region";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16 md:py-24">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            地域を探索し、
            <br />
            お気に入りの場所を発見
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Kissaで日本全国の魅力的な地域と場所を探索し、
            あなただけのお気に入りリストを作成しましょう
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/regions">地域を探索する</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/auth/register">今すぐ始める</a>
            </Button>
          </div>
        </div>
      </section>

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

      {/* Features */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Kissaの特徴</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗺️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">地域探索</h3>
              <p className="text-muted-foreground">
                日本全国の魅力的な地域を発見し、詳細な情報を確認できます
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">チェックイン</h3>
              <p className="text-muted-foreground">
                訪れた場所にチェックインして、思い出を記録しましょう
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">お気に入り管理</h3>
              <p className="text-muted-foreground">
                気に入った地域や場所をお気に入りに追加して管理できます
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
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
