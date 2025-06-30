import { Edit, Eye, MapPin, Plus, Search, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUserAction } from "@/actions/auth";
import { listPlacesAction } from "@/actions/place";
import { UserLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlaceCategory } from "@/core/domain/place/types";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "場所管理 - 編集者 - Kissa",
  description: "場所の作成、編集、削除を行います",
};

interface PlaceManagementPageProps {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    limit?: string;
    category?: string;
  }>;
}

export default async function PlaceManagementPage({
  searchParams,
}: PlaceManagementPageProps) {
  const { result: user, error } = await getCurrentUserAction();

  if (error) {
    console.error("Failed to get current user:", error);
  }

  if (!user || !UserDomain.hasMinimumRole(user, "editor")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">アクセス権限がありません</h1>
          <p className="text-muted-foreground mb-4">
            このページにアクセスするには編集者権限が必要です。
          </p>
          <Button asChild>
            <Link href="/dashboard">ダッシュボードに戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const keyword = params.keyword || "";
  const page = Number.parseInt(params.page || "1", 10);
  const limit = Number.parseInt(params.limit || "20", 10);
  const category = params.category as PlaceCategory | undefined;

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">場所管理</h1>
            <p className="text-muted-foreground">
              場所の作成、編集、削除を行います
            </p>
          </div>
          <Button asChild>
            <Link href="/editor/places/new">
              <Plus className="h-4 w-4 mr-2" />
              新しい場所を作成
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総場所数</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">428</div>
              <p className="text-xs text-muted-foreground">+12 今月</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">公開中</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">356</div>
              <p className="text-xs text-muted-foreground">83%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">下書き</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">52</div>
              <p className="text-xs text-muted-foreground">編集中</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">アーカイブ</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">20</div>
              <p className="text-xs text-muted-foreground">5%</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>場所を検索</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="flex gap-4">
              <div className="flex-1">
                <Input
                  name="keyword"
                  placeholder="場所名やキーワードで検索..."
                  defaultValue={keyword}
                  className="w-full"
                />
              </div>
              <div className="w-48">
                <select
                  name="category"
                  defaultValue={category || ""}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">全カテゴリー</option>
                  <option value="restaurant">レストラン</option>
                  <option value="cafe">カフェ</option>
                  <option value="hotel">ホテル</option>
                  <option value="shopping">ショッピング</option>
                  <option value="entertainment">エンターテイメント</option>
                  <option value="culture">文化</option>
                  <option value="nature">自然</option>
                  <option value="historical">歴史</option>
                  <option value="religious">宗教</option>
                  <option value="transportation">交通</option>
                  <option value="hospital">病院</option>
                  <option value="education">教育</option>
                  <option value="office">オフィス</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                検索
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Place List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {keyword || category ? "検索結果" : "場所一覧"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<PlaceTableSkeleton />}>
              <PlaceTable
                keyword={keyword}
                page={page}
                limit={limit}
                category={category}
                userId={user.id}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}

async function PlaceTable({
  keyword,
  page,
  limit,
  category,
  userId,
}: {
  keyword: string;
  page: number;
  limit: number;
  category?: PlaceCategory;
  userId: string;
}) {
  // Build filter based on search parameters
  const filter: { keyword?: string; category?: PlaceCategory } = {};

  if (keyword) {
    filter.keyword = keyword;
  }

  if (category) {
    filter.category = category;
  }

  const { result: placesData, error } = await listPlacesAction(
    {
      filter,
      pagination: { page, limit, order: "desc", orderBy: "createdAt" },
    },
    userId,
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">場所の読み込みに失敗しました</p>
      </div>
    );
  }

  if (!placesData || placesData.items.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          {keyword || category
            ? "検索条件に一致する場所が見つかりませんでした。"
            : "場所がまだ登録されていません。"}
        </p>
        <Button asChild>
          <Link href="/editor/places/new">
            <Plus className="h-4 w-4 mr-2" />
            最初の場所を作成
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>場所名</TableHead>
            <TableHead>カテゴリー</TableHead>
            <TableHead>地域</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>チェックイン数</TableHead>
            <TableHead>お気に入り数</TableHead>
            <TableHead>作成日</TableHead>
            <TableHead>アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {placesData.items.map((place) => (
            <TableRow key={place.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{place.name}</div>
                  {place.shortDescription && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {place.shortDescription}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <PlaceCategoryBadge category={place.category} />
              </TableCell>
              <TableCell>
                <div className="text-sm">{place.regionName || "不明"}</div>
              </TableCell>
              <TableCell>
                <PlaceStatusBadge status={place.status} />
              </TableCell>
              <TableCell>{place.checkinCount || 0}</TableCell>
              <TableCell>{place.favoriteCount || 0}</TableCell>
              <TableCell>
                {new Date(place.createdAt).toLocaleDateString("ja-JP")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/places/${place.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/editor/places/${place.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {placesData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: placesData.totalPages }, (_, i) => (
            <Button
              key={`page-${i + 1}`}
              variant={page === i + 1 ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link
                href={`/editor/places?${new URLSearchParams({
                  ...(keyword && { keyword }),
                  ...(category && { category }),
                  page: (i + 1).toString(),
                  limit: limit.toString(),
                }).toString()}`}
              >
                {i + 1}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaceStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    published: { label: "公開中", variant: "default" as const },
    draft: { label: "下書き", variant: "secondary" as const },
    archived: { label: "アーカイブ", variant: "destructive" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function PlaceCategoryBadge({ category }: { category: string }) {
  const categoryConfig = {
    restaurant: { label: "レストラン", variant: "default" as const },
    cafe: { label: "カフェ", variant: "secondary" as const },
    hotel: { label: "ホテル", variant: "secondary" as const },
    shopping: { label: "ショッピング", variant: "secondary" as const },
    entertainment: {
      label: "エンターテイメント",
      variant: "secondary" as const,
    },
    culture: { label: "文化", variant: "secondary" as const },
    nature: { label: "自然", variant: "secondary" as const },
    historical: { label: "歴史", variant: "secondary" as const },
    religious: { label: "宗教", variant: "secondary" as const },
    transportation: { label: "交通", variant: "secondary" as const },
    hospital: { label: "病院", variant: "secondary" as const },
    education: { label: "教育", variant: "secondary" as const },
    office: { label: "オフィス", variant: "secondary" as const },
    other: { label: "その他", variant: "secondary" as const },
  };

  const config = categoryConfig[category as keyof typeof categoryConfig] || {
    label: category,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function PlaceTableSkeleton() {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>場所名</TableHead>
            <TableHead>カテゴリー</TableHead>
            <TableHead>地域</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>チェックイン数</TableHead>
            <TableHead>お気に入り数</TableHead>
            <TableHead>作成日</TableHead>
            <TableHead>アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }, (_, i) => (
            <TableRow key={`place-skeleton-${i + 1}`}>
              <TableCell>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                </div>
              </TableCell>
              <TableCell>
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-8 bg-muted rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-8 bg-muted rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
