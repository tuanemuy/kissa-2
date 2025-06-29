import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  ShareIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPlaceByIdAction } from "@/actions/place";
import { getRegionByIdAction } from "@/actions/region";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateKey } from "@/lib/utils";

interface PlaceDetailPageProps {
  params: {
    id: string;
  };
}

async function PlaceDetails({ placeId }: { placeId: string }) {
  try {
    const place = await getPlaceByIdAction(placeId);

    // Get region details if available
    let region = null;
    if (place.regionId) {
      try {
        region = await getRegionByIdAction(place.regionId);
      } catch (_error) {
        // Region might not be accessible, continue without it
      }
    }

    return (
      <div className="space-y-8">
        {/* Place Header */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {place.name}
                </h1>
                {place.isFavorited && (
                  <HeartIcon className="h-6 w-6 text-red-500 fill-current" />
                )}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <Badge variant="outline">
                  {place.category === "restaurant" && "レストラン"}
                  {place.category === "culture" && "文化施設"}
                  {place.category === "shopping" && "ショッピング"}
                  {place.category === "hotel" && "宿泊施設"}
                  {place.category === "transportation" && "交通機関"}
                  {place.category === "entertainment" && "エンターテイメント"}
                  {place.category === "office" && "オフィス"}
                  {place.category === "other" && "その他"}
                </Badge>

                {place.averageRating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-semibold">
                      {place.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}

                {region && (
                  <Link
                    href={`/regions/${region.id}`}
                    className="text-blue-600 hover:text-blue-500 text-sm"
                  >
                    📍 {region.name}
                  </Link>
                )}
              </div>

              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {place.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">連絡先</h3>
                  {place.phone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-500" />
                      <a
                        href={`tel:${place.phone}`}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        {place.phone}
                      </a>
                    </div>
                  )}
                  {place.website && (
                    <div className="flex items-center gap-2">
                      <GlobeIcon className="h-4 w-4 text-gray-500" />
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-500"
                      >
                        ウェブサイト
                      </a>
                    </div>
                  )}
                  {place.coordinates && (
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {place.coordinates.latitude.toFixed(6)},{" "}
                        {place.coordinates.longitude.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">詳細情報</h3>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">作成:</span>
                    <span>
                      {new Date(place.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  {place.visitCount && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">訪問回数:</span>
                      <span className="font-semibold">{place.visitCount}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">ステータス:</span>
                    <Badge
                      variant={
                        place.status === "published" ? "default" : "secondary"
                      }
                    >
                      {place.status === "published" ? "公開中" : place.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm">
                <ShareIcon className="h-4 w-4 mr-2" />
                共有
              </Button>
              <Button variant="outline" size="sm">
                <HeartIcon className="h-4 w-4 mr-2" />
                お気に入り
              </Button>
              <Button size="sm">
                <CheckIcon className="h-4 w-4 mr-2" />
                チェックイン
              </Button>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        {place.businessHours && Object.keys(place.businessHours).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              営業時間
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(place.businessHours).map(([day, hours]) => (
                <div key={day} className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    {day === "monday" && "月曜日"}
                    {day === "tuesday" && "火曜日"}
                    {day === "wednesday" && "水曜日"}
                    {day === "thursday" && "木曜日"}
                    {day === "friday" && "金曜日"}
                    {day === "saturday" && "土曜日"}
                    {day === "sunday" && "日曜日"}
                  </span>
                  <span className="text-gray-600">
                    {hours && !hours.isClosed
                      ? `${hours.openTime} - ${hours.closeTime}`
                      : "定休日"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map or Location Info */}
        {place.coordinates && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">位置情報</h3>
            <p className="text-blue-800 mb-4">
              緯度: {place.coordinates.latitude}, 経度:{" "}
              {place.coordinates.longitude}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `https://maps.google.com/?q=${place.coordinates?.latitude},${place.coordinates?.longitude}`;
                window.open(url, "_blank");
              }}
            >
              <MapPinIcon className="h-4 w-4 mr-2" />
              Google Mapsで開く
            </Button>
          </div>
        )}
      </div>
    );
  } catch (_error) {
    notFound();
  }
}

export default function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Place Details */}
        <Suspense
          fallback={
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm p-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="flex gap-4 mb-4">
                  <div className="h-6 w-20 bg-gray-200 rounded" />
                  <div className="h-6 w-24 bg-gray-200 rounded" />
                </div>
                <div className="space-y-2 mb-6">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={generateKey("place-detail-left", i)}
                        className="h-4 bg-gray-200 rounded"
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={generateKey("place-detail-right", i)}
                        className="h-4 bg-gray-200 rounded"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <PlaceDetails placeId={params.id} />
        </Suspense>
      </div>
    </div>
  );
}
