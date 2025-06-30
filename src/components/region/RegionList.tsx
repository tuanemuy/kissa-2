import { Heart, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { listRegionsAction, searchRegionsAction } from "@/actions/region";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RegionListProps {
  keyword?: string;
  page?: number;
  limit?: number;
}

export async function RegionList({
  keyword = "",
  page = 1,
  limit = 20,
}: RegionListProps) {
  // Use search or list based on whether keyword is provided
  const result = keyword
    ? await searchRegionsAction({
        keyword,
        pagination: {
          page,
          limit,
          order: "desc",
          orderBy: "createdAt",
        },
      })
    : await listRegionsAction({
        pagination: {
          page,
          limit,
          order: "desc",
          orderBy: "createdAt",
        },
        filter: {
          status: "published",
        },
      });

  const { result: data, error } = result;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          地域の読み込み中にエラーが発生しました
        </p>
      </div>
    );
  }

  if (!data || !data.items.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {keyword
            ? `「${keyword}」に一致する地域が見つかりませんでした`
            : "地域が見つかりませんでした"}
        </p>
        {keyword && (
          <p className="text-sm text-muted-foreground mt-2">
            別のキーワードで検索してみてください
          </p>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">地域の読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.items.map((region) => (
          <Link
            key={region.id}
            href={`/regions/${region.id}`}
            className="group"
          >
            <div className="bg-card rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {region.coverImage && (
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={region.coverImage}
                    alt={region.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                    {region.name}
                  </h3>
                  {region.isFavorited && (
                    <Heart className="h-5 w-5 text-red-500 fill-current flex-shrink-0 ml-2" />
                  )}
                </div>

                {region.shortDescription && (
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {region.shortDescription}
                  </p>
                )}

                {region.address && (
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="line-clamp-1">{region.address}</span>
                  </div>
                )}

                {region.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {region.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {region.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{region.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{region.placeCount}件の場所</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{region.favoriteCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link href={buildPaginationUrl(keyword, page - 1, limit)}>
                前のページ
              </Link>
            </Button>
          )}

          <span className="flex items-center px-4 py-2 text-sm text-muted-foreground">
            {page} / {data.totalPages}
          </span>

          {page < data.totalPages && (
            <Button variant="outline" asChild>
              <Link href={buildPaginationUrl(keyword, page + 1, limit)}>
                次のページ
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function buildPaginationUrl(
  keyword: string,
  page: number,
  limit: number,
): string {
  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);
  if (page > 1) params.set("page", page.toString());
  if (limit !== 20) params.set("limit", limit.toString());

  const queryString = params.toString();
  return `/regions${queryString ? `?${queryString}` : ""}`;
}
