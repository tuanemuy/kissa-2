import { BarChart3, MapPin, Plus, Settings, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUserAction } from "@/actions/auth";
import { UserLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "編集者ダッシュボード - Kissa",
  description: "地域と場所の管理、コンテンツの編集を行います",
};

export default async function EditorDashboardPage() {
  return (
    <UserLayout>
      <Suspense fallback={<EditorDashboardSkeleton />}>
        <EditorDashboardContent />
      </Suspense>
    </UserLayout>
  );
}

async function EditorDashboardContent() {
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

  const userDisplayName = UserDomain.getDisplayName(user);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">編集者ダッシュボード</h1>
        <p className="text-muted-foreground">
          {userDisplayName}さん、地域と場所の管理を行いましょう
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button asChild className="h-auto p-6">
          <Link
            href="/editor/regions/new"
            className="flex flex-col items-center space-y-2"
          >
            <Plus className="h-8 w-8" />
            <span>新しい地域を作成</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-auto p-6">
          <Link
            href="/editor/places/new"
            className="flex flex-col items-center space-y-2"
          >
            <MapPin className="h-8 w-8" />
            <span>新しい場所を追加</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-auto p-6">
          <Link
            href="/editor/regions"
            className="flex flex-col items-center space-y-2"
          >
            <Settings className="h-8 w-8" />
            <span>地域を管理</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-auto p-6">
          <Link
            href="/editor/places"
            className="flex flex-col items-center space-y-2"
          >
            <Users className="h-8 w-8" />
            <span>場所を管理</span>
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理中の地域</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 今月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理中の場所</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">187</div>
            <p className="text-xs text-muted-foreground">+12 今月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の承認</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">43</div>
            <p className="text-xs text-muted-foreground">前月比 +18%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              アクティブ地域
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">21</div>
            <p className="text-xs text-muted-foreground">全体の87%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>最近のアクティビティ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityItem
                type="create"
                description="新宿区に「カフェ・ド・クリエ」を追加"
                time="2時間前"
              />
              <ActivityItem
                type="update"
                description="渋谷区の情報を更新"
                time="4時間前"
              />
              <ActivityItem
                type="approve"
                description="横浜市中区の場所申請を承認"
                time="1日前"
              />
              <ActivityItem
                type="create"
                description="「湘南エリア」地域を新規作成"
                time="2日前"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>承認待ち</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/editor/approvals">すべて見る</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <PendingItem
                title="「品川区大井町」場所申請"
                description="ユーザーからの新規場所登録申請"
                submittedBy="田中太郎"
                submittedAt="3時間前"
              />
              <PendingItem
                title="「目黒区自由が丘」情報更新"
                description="営業時間とアクセス情報の更新申請"
                submittedBy="佐藤花子"
                submittedAt="6時間前"
              />
              <PendingItem
                title="「港区六本木」場所申請"
                description="新しいレストランの登録申請"
                submittedBy="鈴木一郎"
                submittedAt="1日前"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Regions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>人気の地域（今月）</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/editor/analytics">詳細分析</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PopularRegionCard
              name="渋谷区"
              visits={1234}
              growth={"+23%"}
              places={45}
            />
            <PopularRegionCard
              name="新宿区"
              visits={987}
              growth={"+18%"}
              places={38}
            />
            <PopularRegionCard
              name="港区"
              visits={856}
              growth={"+15%"}
              places={52}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EditorDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Welcome Section Skeleton */}
      <div>
        <div className="h-8 bg-muted rounded w-1/2 mb-2 animate-pulse" />
        <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements don't reorder
            key={`action-skeleton-${i}`}
            className="h-24 bg-muted rounded animate-pulse"
          />
        ))}
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <Card
            // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements don't reorder
            key={`stats-skeleton-${i}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2 animate-pulse" />
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-5 bg-muted rounded w-1/3 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements don't reorder
                  key={`activity-skeleton-${i}`}
                  className="flex items-start space-x-3"
                >
                  <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-5 bg-muted rounded w-1/3 animate-pulse" />
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements don't reorder
                  key={`pending-skeleton-${i}`}
                  className="p-3 rounded-lg border"
                >
                  <div className="h-4 bg-muted rounded mb-2 animate-pulse" />
                  <div className="h-3 bg-muted rounded mb-2 animate-pulse" />
                  <div className="flex justify-between">
                    <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Regions Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-5 bg-muted rounded w-1/3 animate-pulse" />
            <div className="h-8 w-20 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements don't reorder
                key={`popular-skeleton-${i}`}
                className="p-4 rounded-lg border"
              >
                <div className="h-5 bg-muted rounded mb-2 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityItem({
  type,
  description,
  time,
}: {
  type: "create" | "update" | "approve";
  description: string;
  time: string;
}) {
  const icons = {
    create: Plus,
    update: Settings,
    approve: Users,
  };

  const colors = {
    create: "text-green-600",
    update: "text-blue-600",
    approve: "text-purple-600",
  };

  const Icon = icons[type];

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
        <Icon className={`h-4 w-4 ${colors[type]}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  );
}

function PendingItem({
  title,
  description,
  submittedBy,
  submittedAt,
}: {
  title: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
}) {
  return (
    <div className="p-3 rounded-lg border">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm">{title}</h4>
        <Button size="sm" variant="outline">
          確認
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>申請者: {submittedBy}</span>
        <span>{submittedAt}</span>
      </div>
    </div>
  );
}

function PopularRegionCard({
  name,
  visits,
  growth,
  places,
}: {
  name: string;
  visits: number;
  growth: string;
  places: number;
}) {
  return (
    <div className="p-4 rounded-lg border">
      <h4 className="font-medium mb-2">{name}</h4>
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">訪問数</span>
          <span className="font-semibold">{visits.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">成長率</span>
          <span className="text-green-600 font-semibold">{growth}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">場所数</span>
          <span className="font-semibold">{places}</span>
        </div>
      </div>
    </div>
  );
}
