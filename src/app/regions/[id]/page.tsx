import {
  ArrowLeftIcon,
  BuildingIcon,
  CalendarIcon,
  HeartIcon,
  MapPinIcon,
  ShareIcon,
  TagIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPlacesByRegionAction } from "@/actions/place";
import { getRegionByIdAction } from "@/actions/region";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RegionDetailPageProps {
  params: {
    id: string;
  };
}

async function RegionDetails({ regionId }: { regionId: string }) {
  try {
    const region = await getRegionByIdAction(regionId);

    return (
      <div className="space-y-8">
        {/* Region Header */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {region.name}
                </h1>
                {region.isFavorited && (
                  <HeartIcon className="h-6 w-6 text-red-500 fill-current" />
                )}
              </div>

              {region.tags && region.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <TagIcon className="h-4 w-4 text-gray-500 mt-1" />
                  {region.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {region.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BuildingIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">場所数:</span>
                  <span className="font-semibold">
                    {region.placeCount || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <HeartIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">お気に入り:</span>
                  <span className="font-semibold">
                    {region.favoriteCount || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">作成:</span>
                  <span className="font-semibold">
                    {new Date(region.createdAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">位置:</span>
                  <span className="font-semibold">
                    {region.coordinates?.latitude.toFixed(3)},{" "}
                    {region.coordinates?.longitude.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ShareIcon className="h-4 w-4 mr-2" />
                共有
              </Button>
              <Button variant="outline" size="sm">
                <HeartIcon className="h-4 w-4 mr-2" />
                お気に入り
              </Button>
            </div>
          </div>
        </div>

        {/* Location Coordinates Info */}
        {region.coordinates && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">位置情報</h3>
            <p className="text-blue-800">
              緯度: {region.coordinates.latitude}, 経度:{" "}
              {region.coordinates.longitude}
            </p>
          </div>
        )}
      </div>
    );
  } catch (_error) {
    notFound();
  }
}

async function PlacesList({ regionId }: { regionId: string }) {
  try {
    const places = await getPlacesByRegionAction(regionId);

    if (places.length === 0) {
      return (
        <div className="text-center py-12">
          <BuildingIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            まだ場所が登録されていません
          </h3>
          <p className="text-gray-600">
            この地域の最初の場所を登録してみませんか？
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {places.map((place) => (
          <Link key={place.id} href={`/places/${place.id}`}>
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-2 flex-1">
                    {place.name}
                  </CardTitle>
                  {place.isFavorited && (
                    <HeartIcon className="h-5 w-5 text-red-500 fill-current" />
                  )}
                </div>
                <Badge variant="outline" className="w-fit">
                  {place.category === "restaurant" && "レストラン"}
                  {place.category === "culture" && "文化施設"}
                  {place.category === "shopping" && "ショッピング"}
                  {place.category === "hotel" && "宿泊施設"}
                  {place.category === "transportation" && "交通機関"}
                  {place.category === "entertainment" && "エンターテイメント"}
                  {place.category === "office" && "オフィス"}
                  {place.category === "other" && "その他"}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 line-clamp-3 mb-4">
                  {place.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    <span>
                      {place.coordinates?.latitude.toFixed(3)},{" "}
                      {place.coordinates?.longitude.toFixed(3)}
                    </span>
                  </div>
                  {place.averageRating && (
                    <div className="flex items-center gap-1">
                      <span>⭐</span>
                      <span>{place.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  } catch (_error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">場所の読み込みに失敗しました</p>
      </div>
    );
  }
}

export default function RegionDetailPage({ params }: RegionDetailPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/regions"
            className="inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            地域一覧に戻る
          </Link>
        </div>

        {/* Region Details */}
        <Suspense
          fallback={
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm p-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="space-y-2 mb-6">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <RegionDetails regionId={params.id} />
        </Suspense>

        {/* Places Section */}
        <div className="mt-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              この地域の場所
            </h2>
            <p className="text-gray-600">この地域に登録されている場所一覧</p>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="h-48 animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded" />
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </div>
                      <div className="flex justify-between">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-4 w-12 bg-gray-200 rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }
          >
            <PlacesList regionId={params.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
