import { Clock, Heart, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PlaceWithStats } from "@/core/domain/place/types";

interface PlaceCardProps {
  place: PlaceWithStats;
}

export function PlaceCard({ place }: PlaceCardProps) {
  return (
    <Link href={`/places/${place.id}`} className="group">
      <div className="bg-card rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        {place.images && place.images.length > 0 && (
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={place.images[0]}
              alt={place.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
              {place.name}
            </h3>
            {place.isFavorited && (
              <Heart className="h-5 w-5 text-red-500 fill-current flex-shrink-0 ml-2" />
            )}
          </div>

          {place.description && (
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {place.description}
            </p>
          )}

          <div className="space-y-2 mb-3">
            {place.address && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">{place.address}</span>
              </div>
            )}

            {place.phone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{place.phone}</span>
              </div>
            )}

            {place.businessHours && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">
                  {formatBusinessHours(place.businessHours)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {getCategoryDisplayName(place.category)}
            </Badge>

            <div className="text-xs text-muted-foreground">
              {place.checkinCount}回チェックイン
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    restaurant: "レストラン",
    cafe: "カフェ",
    shop: "ショップ",
    hotel: "ホテル",
    attraction: "観光地",
    park: "公園",
    museum: "博物館",
    temple: "寺院・神社",
    other: "その他",
  };

  return categoryMap[category] || category;
}

function formatBusinessHours(businessHours: unknown): string {
  // Assuming businessHours is a JSON object with day-specific hours
  // This is a simplified implementation
  if (typeof businessHours === "string") {
    return businessHours;
  }

  if (typeof businessHours === "object" && businessHours !== null) {
    // For now, just show a generic message
    return "営業時間詳細はクリックして確認";
  }

  return "営業時間要確認";
}