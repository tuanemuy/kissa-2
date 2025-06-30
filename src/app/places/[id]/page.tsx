import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  Clock,
  ExternalLink,
  Globe,
  Heart,
  Mail,
  MapPin,
  Phone,
  Star,
  Users,
} from "lucide-react";
import { getPlaceByIdAction } from "@/actions/place";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PlaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PlaceDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { result: place } = await getPlaceByIdAction(id);

  if (!place) {
    return {
      title: "場所が見つかりません - Kissa",
    };
  }

  return {
    title: `${place.name} - Kissa`,
    description:
      place.shortDescription ||
      place.description ||
      `${place.name}の詳細情報`,
  };
}

export default async function PlaceDetailPage({
  params,
}: PlaceDetailPageProps) {
  const { id } = await params;
  const { result: place, error } = await getPlaceByIdAction(id);

  if (error || !place) {
    notFound();
  }

  return (
    <main className="container mx-auto py-8">
      {/* Hero Section */}
      <div className="relative mb-8">
        {place.coverImage && (
          <div className="w-full h-64 md:h-96 relative rounded-lg overflow-hidden">
            <Image
              src={place.coverImage}
              alt={place.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <Badge
                    variant="secondary"
                    className="mb-2 bg-white/20 text-white border-white/30"
                  >
                    {getCategoryDisplayName(place.category)}
                  </Badge>
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">
                    {place.name}
                  </h1>
                  {place.shortDescription && (
                    <p className="text-lg opacity-90">{place.shortDescription}</p>
                  )}
                </div>
                {place.averageRating && (
                  <div className="flex items-center bg-white/20 rounded-lg px-3 py-1 backdrop-blur-sm">
                    <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                    <span className="font-semibold">
                      {place.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!place.coverImage && (
          <div className="bg-muted rounded-lg p-8 text-center">
            <Badge variant="secondary" className="mb-4">
              {getCategoryDisplayName(place.category)}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              {place.name}
            </h1>
            {place.shortDescription && (
              <p className="text-lg text-muted-foreground">
                {place.shortDescription}
              </p>
            )}
            {place.averageRating && (
              <div className="flex items-center justify-center mt-4">
                <Star className="h-5 w-5 text-yellow-500 fill-current mr-1" />
                <span className="font-semibold text-lg">
                  {place.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {place.description && (
            <Card>
              <CardHeader>
                <CardTitle>詳細情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{place.description}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {place.images && place.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>写真</CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoGallery images={place.images} placeName={place.name} />
              </CardContent>
            </Card>
          )}

          {place.businessHours && place.businessHours.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>営業時間</CardTitle>
              </CardHeader>
              <CardContent>
                <BusinessHours businessHours={place.businessHours} />
              </CardContent>
            </Card>
          )}

          <Suspense fallback={<CheckinListSkeleton />}>
            <CheckinListCard placeId={place.id} />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg p-6 sticky top-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">基本情報</h3>
              <div className="space-y-4">
                {place.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">住所</p>
                      <p className="text-sm text-muted-foreground">
                        {place.address}
                      </p>
                    </div>
                  </div>
                )}

                {place.phone && (
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">電話番号</p>
                      <a
                        href={`tel:${place.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {place.phone}
                      </a>
                    </div>
                  </div>
                )}

                {place.email && (
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">メール</p>
                      <a
                        href={`mailto:${place.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {place.email}
                      </a>
                    </div>
                  </div>
                )}

                {place.website && (
                  <div className="flex items-start space-x-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">ウェブサイト</p>
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center"
                      >
                        公式サイト
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3">統計情報</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {place.favoriteCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    お気に入り
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {place.checkinCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    チェックイン
                  </div>
                </div>
              </div>
            </div>

            {place.tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-3">タグ</h4>
                  <div className="flex flex-wrap gap-1">
                    {place.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-2">
              <AuthPrompt />
            </div>

            {place.regionName && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">地域</p>
                  <Link
                    href={`/regions/${place.regionId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {place.regionName}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    restaurant: "レストラン",
    cafe: "カフェ",
    hotel: "ホテル",
    shopping: "ショッピング",
    entertainment: "エンターテイメント",
    culture: "文化施設",
    nature: "自然",
    historical: "歴史的建造物",
    religious: "宗教施設",
    transportation: "交通機関",
    hospital: "医療機関",
    education: "教育機関",
    office: "オフィス",
    other: "その他",
  };

  return categoryMap[category] || category;
}

function PhotoGallery({
  images,
  placeName,
}: {
  images: string[];
  placeName: string;
}) {
  const [mainImage, ...otherImages] = images;

  return (
    <div className="space-y-4">
      <div className="aspect-video relative rounded-lg overflow-hidden">
        <Image
          src={mainImage}
          alt={`${placeName}のメイン写真`}
          fill
          className="object-cover"
        />
      </div>
      {otherImages.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {otherImages.slice(0, 6).map((image, index) => (
            <div
              key={image}
              className="aspect-square relative rounded overflow-hidden"
            >
              <Image
                src={image}
                alt={`${placeName}の写真 ${index + 2}`}
                fill
                className="object-cover"
              />
              {index === 5 && otherImages.length > 6 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    +{otherImages.length - 5}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BusinessHours({
  businessHours,
}: {
  businessHours: Array<{
    dayOfWeek: string;
    openTime?: string;
    closeTime?: string;
    isClosed: boolean;
  }>;
}) {
  const dayNames: Record<string, string> = {
    monday: "月曜日",
    tuesday: "火曜日",
    wednesday: "水曜日",
    thursday: "木曜日",
    friday: "金曜日",
    saturday: "土曜日",
    sunday: "日曜日",
  };

  return (
    <div className="space-y-2">
      {businessHours.map((hours) => (
        <div
          key={hours.dayOfWeek}
          className="flex justify-between items-center py-1"
        >
          <span className="text-sm font-medium">
            {dayNames[hours.dayOfWeek]}
          </span>
          <span className="text-sm text-muted-foreground">
            {hours.isClosed
              ? "定休日"
              : hours.openTime && hours.closeTime
                ? `${hours.openTime} - ${hours.closeTime}`
                : "営業時間要確認"}
          </span>
        </div>
      ))}
    </div>
  );
}

function CheckinListCard({ placeId: _ }: { placeId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          最近のチェックイン
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>チェックイン機能は開発中です</p>
          <p className="text-sm mt-1">ログインして利用できるようになります</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CheckinListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          最近のチェックイン
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements don't reorder
              key={`checkin-loading-${i}`}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AuthPrompt() {
  return (
    <>
      <Button className="w-full" size="sm" asChild>
        <Link href="/auth/login?redirect=/dashboard">
          <Heart className="h-4 w-4 mr-2" />
          お気に入りに追加
        </Link>
      </Button>
      <Button variant="outline" className="w-full" size="sm" asChild>
        <Link href="/auth/login?redirect=/dashboard">
          <Clock className="h-4 w-4 mr-2" />
          チェックイン
        </Link>
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        ログインして機能を利用できます
      </p>
    </>
  );
}