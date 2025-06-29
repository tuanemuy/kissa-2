import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  HeartIcon,
  MapPinIcon,
  PlusIcon,
  TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getDashboardSummaryAction } from "@/actions/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { generateKey } from "@/lib/utils";

async function DashboardContent() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/auth/login");
    }

    const dashboardData = await getDashboardSummaryAction(user.id);

    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            おかえりなさい、{user.name}さん
          </h1>
          <p className="text-gray-600">今日も新しい発見をしましょう！</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                総チェックイン数
              </CardTitle>
              <CheckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.checkinStats.totalCheckins}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.checkinStats.uniquePlaces}箇所を訪問
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                お気に入り地域
              </CardTitle>
              <HeartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.favoriteRegions.length}
              </div>
              <p className="text-xs text-muted-foreground">
                地域をお気に入り登録
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                ピン留め地域
              </CardTitle>
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.pinnedRegions.length}
              </div>
              <p className="text-xs text-muted-foreground">すぐアクセス可能</p>
            </CardContent>
          </Card>
        </div>

        {/* Pinned Regions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              ピン留め地域
            </h2>
            <Link href="/pinned">
              <Button variant="outline" size="sm">
                管理 <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {dashboardData.pinnedRegions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.pinnedRegions.slice(0, 3).map((region) => (
                <Link key={region.id} href={`/regions/${region.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base line-clamp-1">
                        {region.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {region.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        <span>{region.placeCount || 0} 箇所</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <MapPinIcon className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ピン留め地域がありません
                </h3>
                <p className="text-gray-600 mb-4 text-center">
                  よく訪れる地域をピン留めして、素早くアクセスしましょう
                </p>
                <Link href="/regions">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    地域を探す
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Checkins */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              最近のチェックイン
            </h2>
            <Link href="/checkins">
              <Button variant="outline" size="sm">
                すべて見る <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {dashboardData.recentCheckins.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentCheckins.map((checkin) => (
                <Card key={checkin.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link
                            href={`/places/${checkin.placeId}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {checkin.placeName}
                          </Link>
                          {checkin.rating && (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">⭐</span>
                              <span className="text-sm">{checkin.rating}</span>
                            </div>
                          )}
                        </div>
                        {checkin.comment && (
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {checkin.comment}
                          </p>
                        )}
                        <div className="flex items-center text-xs text-gray-500">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          <span>
                            {new Date(checkin.createdAt).toLocaleDateString(
                              "ja-JP",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline">チェックイン</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckIcon className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  まだチェックインがありません
                </h3>
                <p className="text-gray-600 mb-4 text-center">
                  訪れた場所にチェックインして、思い出を記録しましょう
                </p>
                <Link href="/regions">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    場所を探す
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommended Regions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              おすすめの地域
            </h2>
            <Link href="/regions">
              <Button variant="outline" size="sm">
                もっと見る <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.recommendations.map((region) => (
              <Link key={region.id} href={`/regions/${region.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base line-clamp-1">
                      {region.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {region.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        <span>{region.placeCount || 0} 箇所</span>
                      </div>
                      <div className="flex items-center">
                        <TrendingUpIcon className="h-3 w-3 mr-1" />
                        <span>注目</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            クイックアクション
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/regions">
              <Button variant="outline" className="w-full">
                <MapPinIcon className="h-4 w-4 mr-2" />
                地域を探す
              </Button>
            </Link>
            <Link href="/favorites">
              <Button variant="outline" className="w-full">
                <HeartIcon className="h-4 w-4 mr-2" />
                お気に入り
              </Button>
            </Link>
            <Link href="/checkins">
              <Button variant="outline" className="w-full">
                <CheckIcon className="h-4 w-4 mr-2" />
                チェックイン履歴
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full">
                設定
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (_error) {
    redirect("/auth/login");
  }
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="space-y-8">
              {/* Welcome Section Skeleton */}
              <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>

              {/* Stats Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card
                    key={generateKey("stats-skeleton", i)}
                    className="animate-pulse"
                  >
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Content Sections Skeleton */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={generateKey("content-section", i)}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
                    <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Card
                        key={generateKey(`content-card-${i}`, j)}
                        className="h-32 animate-pulse"
                      >
                        <CardContent>
                          <div className="h-full bg-gray-200 rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}
