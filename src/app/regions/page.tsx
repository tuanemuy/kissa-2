import { FilterIcon, HeartIcon, MapPinIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { listRegionsAction, searchRegionsAction } from "@/actions/region";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface RegionsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

async function RegionsList({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  try {
    const keyword = searchParams.keyword as string;
    const page = Number(searchParams.page) || 1;

    let regionsData: Awaited<ReturnType<typeof listRegionsAction>>;

    if (keyword && keyword.trim().length > 0) {
      regionsData = await searchRegionsAction({
        ...searchParams,
        keyword,
        page: String(page),
      });
    } else {
      regionsData = await listRegionsAction({
        ...searchParams,
        page: String(page),
      });
    }

    const { items: regions, totalPages, currentPage, count } = regionsData;

    return (
      <div className="space-y-6">
        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {keyword ? (
              <>
                「{keyword}」の検索結果: {count}件
              </>
            ) : (
              <>{count}件の地域が見つかりました</>
            )}
          </p>
          <div className="text-sm text-gray-500">
            ページ {currentPage} / {totalPages}
          </div>
        </div>

        {/* Regions Grid */}
        {regions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region) => (
              <Link key={region.id} href={`/regions/${region.id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-2 flex-1">
                        {region.name}
                      </CardTitle>
                      {region.isFavorited && (
                        <HeartIcon className="h-5 w-5 text-red-500 fill-current" />
                      )}
                    </div>
                    {region.tags && region.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {region.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
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
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 line-clamp-3 mb-4">
                      {region.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{region.placeCount || 0} 箇所</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HeartIcon className="h-4 w-4" />
                          <span>{region.favoriteCount || 0}</span>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {region.status === "published"
                          ? "公開中"
                          : region.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {keyword ? "検索結果が見つかりませんでした" : "地域がありません"}
            </h3>
            <p className="text-gray-600">
              {keyword
                ? "別のキーワードで検索してみてください"
                : "まだ地域が登録されていません"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            {currentPage > 1 && (
              <Link
                href={`/regions?${new URLSearchParams({
                  ...Object.fromEntries(
                    Object.entries(searchParams).filter(
                      ([key]) => key !== "page",
                    ),
                  ),
                  page: String(currentPage - 1),
                })}`}
              >
                <Button variant="outline">前へ</Button>
              </Link>
            )}

            <span className="mx-4 text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>

            {currentPage < totalPages && (
              <Link
                href={`/regions?${new URLSearchParams({
                  ...Object.fromEntries(
                    Object.entries(searchParams).filter(
                      ([key]) => key !== "page",
                    ),
                  ),
                  page: String(currentPage + 1),
                })}`}
              >
                <Button variant="outline">次へ</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    );
  } catch (_error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">地域の読み込みに失敗しました</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          再読み込み
        </Button>
      </div>
    );
  }
}

export default function RegionsPage({ searchParams }: RegionsPageProps) {
  const keyword = (searchParams.keyword as string) || "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">地域一覧</h1>
          <p className="text-gray-600">日本全国の魅力的な地域を探索しよう</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form method="GET" className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  name="keyword"
                  placeholder="地域名、説明、タグで検索..."
                  defaultValue={keyword}
                  className="h-10"
                />
              </div>
              <Button type="submit">
                <SearchIcon className="h-4 w-4 mr-2" />
                検索
              </Button>
            </div>

            {/* Additional Filters */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">並び順:</span>
              </div>
              <select
                name="orderBy"
                defaultValue={(searchParams.orderBy as string) || "createdAt"}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="createdAt">作成日時</option>
                <option value="name">名前</option>
                <option value="visitCount">人気度</option>
              </select>
              <select
                name="order"
                defaultValue={(searchParams.order as string) || "desc"}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="desc">降順</option>
                <option value="asc">昇順</option>
              </select>
            </div>
          </form>
        </div>

        {/* Results */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded" />
                    <div className="flex gap-1 mt-2">
                      <div className="h-4 w-12 bg-gray-200 rounded" />
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                      <div className="h-4 w-12 bg-gray-200 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          <RegionsList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
