import { Heart, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getUserFavoriteRegionsAction,
  getUserFavoritePlacesAction,
} from "@/actions/favorites";
import { UserLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RemoveFavoriteButton } from "./RemoveFavoriteButton";

export const metadata: Metadata = {
  title: "お気に入り - Kissa",
  description: "お気に入りの地域と場所を管理",
};

export default async function FavoritesPage() {
  const [regionsResult, placesResult] = await Promise.all([
    getUserFavoriteRegionsAction(),
    getUserFavoritePlacesAction(),
  ]);

  const favoriteRegions = regionsResult.result || [];
  const favoritePlaces = placesResult.result || [];

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">お気に入り</h1>
          <p className="text-muted-foreground">
            お気に入りに登録した地域と場所を管理できます。
          </p>
        </div>

        {/* Tabs for Regions and Places */}
        <Tabs defaultValue="regions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="regions" className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              地域 ({favoriteRegions.length})
            </TabsTrigger>
            <TabsTrigger value="places" className="flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              場所 ({favoritePlaces.length})
            </TabsTrigger>
          </TabsList>

          {/* Favorite Regions Tab */}
          <TabsContent value="regions" className="space-y-6">
            {favoriteRegions.length === 0 ? (
              <EmptyState
                title="お気に入りの地域がありません"
                description="興味のある地域をお気に入りに追加して、簡単にアクセスできるようにしましょう。"
                actionText="地域を探す"
                actionHref="/regions"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteRegions.map((region) => (
                  <FavoriteRegionCard key={region.id} region={region} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favorite Places Tab */}
          <TabsContent value="places" className="space-y-6">
            {favoritePlaces.length === 0 ? (
              <EmptyState
                title="お気に入りの場所がありません"
                description="素敵な場所を見つけたら、お気に入りに追加してまた訪れましょう。"
                actionText="場所を探す"
                actionHref="/regions"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritePlaces.map((place) => (
                  <FavoritePlaceCard key={place.id} place={place} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}

function EmptyState({
  title,
  description,
  actionText,
  actionHref,
}: {
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6">{description}</p>
          <Button asChild>
            <Link href={actionHref}>{actionText}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FavoriteRegionCard({
  region,
}: {
  region: {
    id: string;
    name: string;
    description?: string;
    coverImage?: string;
    placeCount: number;
    favoriteCount: number;
    tags: string[];
  };
}) {
  return (
    <Card className="group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{region.name}</CardTitle>
          <RemoveFavoriteButton
            type="region"
            id={region.id}
            name={region.name}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {region.coverImage && (
          <div className="relative h-32 w-full rounded-md overflow-hidden">
            <Image
              src={region.coverImage}
              alt={region.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        {region.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {region.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{region.placeCount}の場所</span>
          <span>{region.favoriteCount}人がお気に入り</span>
        </div>

        {region.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {region.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {region.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{region.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <Button asChild className="w-full" variant="outline">
          <Link href={`/regions/${region.id}`}>詳細を見る</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function FavoritePlaceCard({
  place,
}: {
  place: {
    id: string;
    name: string;
    description?: string;
    coverImage?: string;
    category: string;
    rating?: number;
    checkinCount: number;
    regionName?: string;
  };
}) {
  return (
    <Card className="group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{place.name}</CardTitle>
          <RemoveFavoriteButton type="place" id={place.id} name={place.name} />
        </div>
        {place.regionName && (
          <p className="text-sm text-muted-foreground">{place.regionName}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {place.coverImage && (
          <div className="relative h-32 w-full rounded-md overflow-hidden">
            <Image
              src={place.coverImage}
              alt={place.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        {place.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {place.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {place.category}
          </Badge>
          {place.rating && (
            <div className="flex items-center text-sm">
              <span className="text-yellow-500">★</span>
              <span className="ml-1">{place.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {place.checkinCount}回のチェックイン
        </div>

        <Button asChild className="w-full" variant="outline">
          <Link href={`/places/${place.id}`}>詳細を見る</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
