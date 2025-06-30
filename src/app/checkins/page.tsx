import {
  CalendarDays,
  Camera,
  MapPin,
  MessageSquare,
  Star,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getUserCheckinsAction } from "@/actions/checkins";
import { UserLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "チェックイン履歴 - Kissa",
  description: "過去のチェックイン履歴を確認",
};

export default async function CheckinsPage() {
  const { result: checkins, error } = await getUserCheckinsAction(50);

  if (error) {
    console.error("Failed to get user checkins:", error);
  }

  const userCheckins = checkins || [];

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">チェックイン履歴</h1>
          <p className="text-muted-foreground">
            これまでに訪れた場所とその記録を確認できます。
          </p>
        </div>

        {/* Stats */}
        {userCheckins.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  総チェックイン数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userCheckins.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  訪問した場所
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(userCheckins.map((c) => c.placeId)).size}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  評価した場所
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userCheckins.filter((c) => c.rating).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Checkins List */}
        {userCheckins.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              チェックイン履歴 ({userCheckins.length})
            </h2>

            <div className="space-y-4">
              {userCheckins.map((checkin) => (
                <CheckinCard key={checkin.id} checkin={checkin} />
              ))}
            </div>
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
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            まだチェックインしていません
          </h3>
          <p className="text-muted-foreground mb-6">
            興味のある場所を見つけて、初回のチェックインをしてみましょう。
            チェックインすることで、その場所の思い出を記録できます。
          </p>
          <Button asChild>
            <Link href="/regions">場所を探す</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CheckinCard({
  checkin,
}: {
  checkin: {
    id: string;
    placeId: string;
    placeName?: string;
    placeCategory?: string;
    regionName?: string;
    comment?: string;
    rating?: number;
    isPrivate: boolean;
    createdAt: Date;
    photos?: Array<{
      id: string;
      url: string;
      caption?: string;
    }>;
  };
}) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Checkin Icon */}
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {checkin.placeName || "不明な場所"}
                </h3>
                {checkin.regionName && (
                  <p className="text-sm text-muted-foreground">
                    {checkin.regionName}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  {checkin.createdAt.toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {checkin.isPrivate && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    プライベート
                  </Badge>
                )}
              </div>
            </div>

            {/* Category and Rating */}
            <div className="flex items-center space-x-4">
              {checkin.placeCategory && (
                <Badge variant="outline" className="text-xs">
                  {checkin.placeCategory}
                </Badge>
              )}
              {checkin.rating && (
                <div className="flex items-center text-sm">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span>{checkin.rating}</span>
                </div>
              )}
            </div>

            {/* Comment */}
            {checkin.comment && (
              <>
                <Separator />
                <div className="flex items-start space-x-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{checkin.comment}</p>
                </div>
              </>
            )}

            {/* Photos */}
            {checkin.photos && checkin.photos.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      写真 ({checkin.photos.length}枚)
                    </span>
                  </div>
                  <div className="flex space-x-2 overflow-x-auto">
                    {checkin.photos.slice(0, 4).map((photo) => (
                      <div
                        key={photo.id}
                        className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.caption || "チェックイン写真"}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {checkin.photos.length > 4 && (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          +{checkin.photos.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <Separator />
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/places/${checkin.placeId}`}>場所を見る</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/checkins/${checkin.id}`}>詳細を見る</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
