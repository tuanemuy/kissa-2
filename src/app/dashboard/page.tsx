import { Heart, MapPin, Pin, Plus, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { getUserCheckinsAction } from "@/actions/checkins";
import { getUserFavoriteRegionsAction } from "@/actions/favorites";
import { getUserPinnedRegionsAction } from "@/actions/pinned";
import { UserLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "ダッシュボード - Kissa",
  description: "あなたのお気に入りの地域と場所を管理",
};

export default async function DashboardPage() {
  const { result: user, error } = await getCurrentUserAction();

  if (error) {
    console.error("Failed to get current user:", error);
  }

  if (!user) {
    // UserLayoutが認証をチェックするのでここには来ないはず
    return null;
  }

  const userDisplayName = UserDomain.getDisplayName(user);

  // Fetch user data in parallel
  const [
    { result: favoriteRegions = [] },
    { result: pinnedRegions = [] },
    { result: recentCheckins = [] },
  ] = await Promise.all([
    getUserFavoriteRegionsAction(),
    getUserPinnedRegionsAction(),
    getUserCheckinsAction(20),
  ]);

  // Calculate statistics
  const favoriteRegionsCount = favoriteRegions.length;
  const pinnedRegionsCount = pinnedRegions.length;
  const totalCheckinsCount = recentCheckins.length;

  // Get unique places from checkins to calculate discovered places
  const discoveredPlacesSet = new Set(
    recentCheckins.map((checkin) => checkin.placeId),
  );
  const discoveredPlacesCount = discoveredPlacesSet.size;

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            おかえりなさい、{userDisplayName}さん
          </h1>
          <p className="text-muted-foreground">
            今日はどの地域を探検しますか？
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                お気に入り地域
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favoriteRegionsCount}</div>
              <p className="text-xs text-muted-foreground">お気に入り登録中</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ピン留め</CardTitle>
              <Pin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pinnedRegionsCount}</div>
              <p className="text-xs text-muted-foreground">よく見る地域</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                チェックイン
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCheckinsCount}</div>
              <p className="text-xs text-muted-foreground">総チェックイン数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                発見した場所
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{discoveredPlacesCount}</div>
              <p className="text-xs text-muted-foreground">ユニーク場所数</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pinned Regions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Pin className="h-5 w-5 mr-2" />
                  ピン留めした地域
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/pinned">すべて見る</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pinnedRegions.length > 0 ? (
                  pinnedRegions
                    .slice(0, 3)
                    .map((region) => (
                      <PinnedRegionCard
                        key={region.id}
                        name={region.name}
                        description={region.description || ""}
                        visitCount={region.placeCount || 0}
                        lastVisit="最近"
                        href={`/regions/${region.id}`}
                      />
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>ピン留めした地域がありません</p>
                    <p className="text-sm">
                      気になる地域をピン留めしてみましょう
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/regions">
                    <Plus className="h-4 w-4 mr-2" />
                    新しい地域を探す
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>最近のアクティビティ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCheckins.length > 0 ? (
                  recentCheckins.slice(0, 4).map((checkin) => (
                    <ActivityItem
                      key={checkin.id}
                      type="checkin"
                      description={`${checkin.regionName || "地域"}の「${checkin.placeName || "場所"}」でチェックイン`}
                      time={new Date(checkin.createdAt).toLocaleDateString(
                        "ja-JP",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>まだアクティビティがありません</p>
                    <p className="text-sm">場所にチェックインしてみましょう</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/checkins">履歴をすべて見る</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Regions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>おすすめの地域</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/regions">すべて見る</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RecommendedRegionCard
                name="横浜市中区"
                description="港町の魅力あふれるエリア"
                placeCount={89}
                tags={["観光", "グルメ", "夜景"]}
                href="/regions/4"
              />
              <RecommendedRegionCard
                name="奈良市"
                description="古都の歴史を感じる場所"
                placeCount={42}
                tags={["歴史", "寺院", "自然"]}
                href="/regions/5"
              />
              <RecommendedRegionCard
                name="福岡市中央区"
                description="九州の玄関口"
                placeCount={76}
                tags={["グルメ", "ショッピング", "文化"]}
                href="/regions/6"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}

function PinnedRegionCard({
  name,
  description,
  visitCount,
  lastVisit,
  href,
}: {
  name: string;
  description: string;
  visitCount: number;
  lastVisit: string;
  href: string;
}) {
  return (
    <Link href={href} className="block group">
      <div className="p-3 rounded-lg border hover:bg-accent/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium group-hover:text-primary transition-colors">
            {name}
          </h4>
          <Pin className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground mb-2">{description}</p>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{visitCount}回訪問</span>
          <span>最終訪問: {lastVisit}</span>
        </div>
      </div>
    </Link>
  );
}

function ActivityItem({
  type,
  description,
  time,
}: {
  type: "checkin" | "favorite" | "pin";
  description: string;
  time: string;
}) {
  const icons = {
    checkin: MapPin,
    favorite: Heart,
    pin: Pin,
  };

  const Icon = icons[type];

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  );
}

function RecommendedRegionCard({
  name,
  description,
  placeCount,
  tags,
  href,
}: {
  name: string;
  description: string;
  placeCount: number;
  tags: string[];
  href: string;
}) {
  return (
    <Link href={href} className="block group">
      <div className="p-4 rounded-lg border hover:bg-accent/50 transition-colors">
        <h4 className="font-medium mb-2 group-hover:text-primary transition-colors">
          {name}
        </h4>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">
            {placeCount}の場所
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}
