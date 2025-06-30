import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  MessageSquare,
  Star,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCheckinDetailsAction } from "@/actions/checkins";
import { UserLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "チェックイン詳細 - Kissa",
  description: "チェックインの詳細情報",
};

interface CheckinDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CheckinDetailsPage({
  params,
}: CheckinDetailsPageProps) {
  const { id } = await params;
  const { result: checkin, error } = await getCheckinDetailsAction(id);

  if (error || !checkin) {
    notFound();
  }

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Back Navigation */}
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/checkins">
              <ArrowLeft className="h-4 w-4 mr-2" />
              チェックイン履歴に戻る
            </Link>
          </Button>
        </div>

        {/* Checkin Details */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {checkin.placeName || "不明な場所"}
                </CardTitle>
                {checkin.regionName && (
                  <p className="text-muted-foreground mt-1">
                    {checkin.regionName}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  {checkin.createdAt.toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {checkin.isPrivate && (
                  <Badge variant="secondary" className="text-xs mt-2">
                    プライベート
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category and Rating */}
            <div className="flex items-center space-x-4">
              {checkin.placeCategory && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    カテゴリ:
                  </span>
                  <Badge variant="outline">{checkin.placeCategory}</Badge>
                </div>
              )}
              {checkin.rating && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">評価:</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-medium">{checkin.rating}</span>
                    <span className="text-sm text-muted-foreground ml-1">
                      / 5
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Comment */}
            {checkin.comment && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-3 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    コメント
                  </h3>
                  <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                    {checkin.comment}
                  </p>
                </div>
              </>
            )}

            {/* Location Info */}
            <Separator />
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                位置情報
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                {checkin.userLocation ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        緯度:
                      </span>
                      <span className="text-sm font-mono">
                        {checkin.userLocation.latitude.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        経度:
                      </span>
                      <span className="text-sm font-mono">
                        {checkin.userLocation.longitude.toFixed(6)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    位置情報は記録されていません。
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <Separator />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href={`/places/${checkin.placeId}`}>
                  場所の詳細を見る
                </Link>
              </Button>
              {checkin.regionName && (
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/regions">地域を探索する</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
