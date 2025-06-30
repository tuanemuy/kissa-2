import { Edit, Eye, MapPin, Plus, Search, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUserAction } from "@/actions/auth";
import { listRegionsAction } from "@/actions/region";
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
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "地域管理 - 編集者 - Kissa",
  description: "地域の作成、編集、削除を行います",
};

interface RegionManagementPageProps {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function RegionManagementPage({
  searchParams,
}: RegionManagementPageProps) {
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

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">地域管理</h1>
            <p className="text-muted-foreground">
              地域の作成、編集、削除を行います
            </p>
          </div>
          <Button asChild>
            <Link href="/editor/regions/new">
              <Plus className="h-4 w-4 mr-2" />
              新しい地域を作成
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総地域数</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">124</div>
              <p className="text-xs text-muted-foreground">+8 今月</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">公開中</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98</div>
              <p className="text-xs text-muted-foreground">79%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">下書き</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">編集中</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">非公開</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">6%</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>地域を検索</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="flex gap-4">
              <div className="flex-1">
                <Input
                  name="keyword"
                  placeholder="地域名やキーワードで検索..."
                  defaultValue={keyword}
                  className="w-full"
                />
              </div>
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                検索
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Region List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {keyword ? `「${keyword}」の検索結果` : "地域一覧"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<RegionTableSkeleton />}>
              <RegionTable keyword={keyword} page={page} limit={limit} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}

async function RegionTable({
  keyword,
  page,
  limit,
}: {
  keyword: string;
  page: number;
  limit: number;
}) {
  const { result: regionsData, error } = await listRegionsAction({
    filter: { keyword },
    pagination: { page, limit, order: "desc", orderBy: "createdAt" },
  });

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">地域の読み込みに失敗しました</p>
      </div>
    );
  }

  if (!regionsData || regionsData.items.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          {keyword
            ? "検索条件に一致する地域が見つかりませんでした。"
            : "地域がまだ登録されていません。"}
        </p>
        <Button asChild>
          <Link href="/editor/regions/new">
            <Plus className="h-4 w-4 mr-2" />
            最初の地域を作成
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
            <TableHead>地域名</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>場所数</TableHead>
            <TableHead>お気に入り数</TableHead>
            <TableHead>作成日</TableHead>
            <TableHead>アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {regionsData.items.map((region) => (
            <TableRow key={region.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{region.name}</div>
                  {region.shortDescription && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {region.shortDescription}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <RegionStatusBadge status={region.status} />
              </TableCell>
              <TableCell>{region.placeCount}</TableCell>
              <TableCell>{region.favoriteCount}</TableCell>
              <TableCell>
                {new Date(region.createdAt).toLocaleDateString("ja-JP")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/regions/${region.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/editor/regions/${region.id}/edit`}>
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
      {regionsData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: regionsData.totalPages }, (_, i) => (
            <Button
              key={`page-${i + 1}`}
              variant={page === i + 1 ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link
                href={`/editor/regions?${new URLSearchParams({
                  ...(keyword && { keyword }),
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

function RegionStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    published: { label: "公開中", variant: "default" as const },
    draft: { label: "下書き", variant: "secondary" as const },
    private: { label: "非公開", variant: "destructive" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function RegionTableSkeleton() {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>地域名</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>場所数</TableHead>
            <TableHead>お気に入り数</TableHead>
            <TableHead>作成日</TableHead>
            <TableHead>アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }, (_, i) => (
            <TableRow key={`region-skeleton-${i + 1}`}>
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
