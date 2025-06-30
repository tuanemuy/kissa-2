import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, User, Users } from "lucide-react";
import Image from "next/image";
import { getPlaceCheckinsAction } from "@/actions/place";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CheckinListProps {
  placeId: string;
}

export async function CheckinList({ placeId }: CheckinListProps) {
  const { result: checkins, error } = await getPlaceCheckinsAction(placeId, 5);

  if (error || !checkins?.length) {
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
            <p>まだチェックインがありません</p>
            <p className="text-sm mt-1">最初にチェックインしてみませんか？</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          最近のチェックイン ({checkins.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checkins.map((checkin, index) => (
            <div key={checkin.id}>
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={checkin.userAvatar}
                    alt={checkin.userName}
                  />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {checkin.userName || "匿名ユーザー"}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(checkin.createdAt), {
                        addSuffix: true,
                        locale: ja,
                      })}
                    </div>
                  </div>
                  {checkin.comment && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {checkin.comment}
                    </p>
                  )}
                  {checkin.rating && (
                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <svg
                            key={`star-${checkin.id}-${i}`}
                            className={`h-4 w-4 ${
                              checkin.rating && i < checkin.rating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                            viewBox="0 0 20 20"
                            aria-label={`星 ${i + 1}`}
                          >
                            <title>星 {i + 1}</title>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364 1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">
                        {checkin.rating}/5
                      </span>
                    </div>
                  )}
                  {checkin.photos && checkin.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {checkin.photos.slice(0, 2).map((photo, photoIndex) => (
                        <div
                          key={`photo-${checkin.id}-${photo.id || photoIndex}`}
                          className="relative aspect-square rounded-lg overflow-hidden"
                        >
                          <Image
                            src={photo.url}
                            alt={
                              photo.caption ||
                              `チェックイン写真 ${photoIndex + 1}`
                            }
                            fill
                            className="object-cover"
                          />
                          {photoIndex === 1 && checkin.photos?.length > 2 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                +{checkin.photos?.length - 2}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {index < checkins.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
