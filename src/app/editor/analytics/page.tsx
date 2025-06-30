import {
  BarChart3,
  Calendar,
  MapPin,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { UserLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "詳細分析 - 編集者 - Kissa",
  description: "地域と場所の詳細な分析データを確認します",
};

interface AnalyticsPageProps {
  searchParams: Promise<{
    period?: string;
    tab?: string;
  }>;
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
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
  const period = params.period || "30d";
  const activeTab = params.tab || "overview";

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">詳細分析</h1>
            <p className="text-muted-foreground">
              地域と場所の詳細な分析データを確認します
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select defaultValue={period}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="期間を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">過去7日間</SelectItem>
                <SelectItem value="30d">過去30日間</SelectItem>
                <SelectItem value="90d">過去90日間</SelectItem>
                <SelectItem value="1y">過去1年間</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              カスタム期間
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総訪問数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24,891</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.3% 前期比
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                新規チェックイン
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.7% 前期比
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                平均滞在時間
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3m 42s</div>
              <div className="flex items-center text-xs text-red-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                -5.2% 前期比
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                コンバージョン率
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8%</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2.1% 前期比
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" asChild>
              <Link href="/editor/analytics?tab=overview">概要</Link>
            </TabsTrigger>
            <TabsTrigger value="regions" asChild>
              <Link href="/editor/analytics?tab=regions">地域別</Link>
            </TabsTrigger>
            <TabsTrigger value="places" asChild>
              <Link href="/editor/analytics?tab=places">場所別</Link>
            </TabsTrigger>
            <TabsTrigger value="users" asChild>
              <Link href="/editor/analytics?tab=users">ユーザー</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Traffic Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>訪問数の推移</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        チャートライブラリ統合予定
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Popular Times */}
              <Card>
                <CardHeader>
                  <CardTitle>時間帯別アクティビティ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <TimeSlotBar label="午前 (6-12時)" value={32} />
                    <TimeSlotBar label="午後 (12-18時)" value={68} />
                    <TimeSlotBar label="夜間 (18-24時)" value={45} />
                    <TimeSlotBar label="深夜 (0-6時)" value={12} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Content */}
            <Card>
              <CardHeader>
                <CardTitle>パフォーマンス上位コンテンツ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <TopContentItem
                    name="渋谷区"
                    type="地域"
                    visits={5234}
                    checkins={892}
                    growth="+23%"
                  />
                  <TopContentItem
                    name="新宿区"
                    type="地域"
                    visits={4567}
                    checkins={734}
                    growth="+18%"
                  />
                  <TopContentItem
                    name="スターバックス渋谷店"
                    type="場所"
                    visits={1892}
                    checkins={345}
                    growth="+42%"
                  />
                  <TopContentItem
                    name="築地市場"
                    type="場所"
                    visits={1654}
                    checkins={298}
                    growth="+12%"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>地域別パフォーマンス</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <RegionPerformanceItem
                    name="渋谷区"
                    visits={5234}
                    checkins={892}
                    favorites={156}
                    places={24}
                    growth="+23%"
                  />
                  <RegionPerformanceItem
                    name="新宿区"
                    visits={4567}
                    checkins={734}
                    favorites={134}
                    places={19}
                    growth="+18%"
                  />
                  <RegionPerformanceItem
                    name="港区"
                    visits={3891}
                    checkins={623}
                    favorites={98}
                    places={31}
                    growth="+15%"
                  />
                  <RegionPerformanceItem
                    name="品川区"
                    visits={2456}
                    checkins={412}
                    favorites={76}
                    places={15}
                    growth="+9%"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="places" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>場所別パフォーマンス</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PlacePerformanceItem
                    name="スターバックス渋谷店"
                    category="カフェ"
                    region="渋谷区"
                    visits={1892}
                    checkins={345}
                    favorites={89}
                    growth="+42%"
                  />
                  <PlacePerformanceItem
                    name="築地市場"
                    category="市場"
                    region="中央区"
                    visits={1654}
                    checkins={298}
                    favorites={76}
                    growth="+12%"
                  />
                  <PlacePerformanceItem
                    name="東京タワー"
                    category="観光"
                    region="港区"
                    visits={1423}
                    checkins={267}
                    favorites={145}
                    growth="+8%"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ユーザー統計</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <UserStatItem label="総ユーザー数" value="12,456" />
                  <UserStatItem label="アクティブユーザー" value="8,234" />
                  <UserStatItem label="新規登録（今月）" value="892" />
                  <UserStatItem label="平均セッション時間" value="5m 23s" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ユーザー行動</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <UserBehaviorItem
                    action="チェックイン"
                    count={4234}
                    percentage={68}
                  />
                  <UserBehaviorItem
                    action="お気に入り追加"
                    count={2891}
                    percentage={46}
                  />
                  <UserBehaviorItem
                    action="検索利用"
                    count={5678}
                    percentage={91}
                  />
                  <UserBehaviorItem
                    action="写真投稿"
                    count={1234}
                    percentage={19}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}

function TimeSlotBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-24 text-sm text-muted-foreground">{label}</div>
      <div className="flex-1 bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="w-12 text-sm font-medium text-right">{value}%</div>
    </div>
  );
}

function TopContentItem({
  name,
  type,
  visits,
  checkins,
  growth,
}: {
  name: string;
  type: string;
  visits: number;
  checkins: number;
  growth: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">{type}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{visits.toLocaleString()} 訪問</div>
        <div className="text-sm text-muted-foreground">
          {checkins.toLocaleString()} チェックイン
        </div>
      </div>
      <div className="text-green-600 font-medium">{growth}</div>
    </div>
  );
}

function RegionPerformanceItem({
  name,
  visits,
  checkins,
  favorites,
  places,
  growth,
}: {
  name: string;
  visits: number;
  checkins: number;
  favorites: number;
  places: number;
  growth: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <MapPin className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">{places} 場所</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-8 text-center">
        <div>
          <div className="font-medium">{visits.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">訪問</div>
        </div>
        <div>
          <div className="font-medium">{checkins.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">チェックイン</div>
        </div>
        <div>
          <div className="font-medium">{favorites}</div>
          <div className="text-xs text-muted-foreground">お気に入り</div>
        </div>
      </div>
      <div className="text-green-600 font-medium">{growth}</div>
    </div>
  );
}

function PlacePerformanceItem({
  name,
  category,
  region,
  visits,
  checkins,
  favorites,
  growth,
}: {
  name: string;
  category: string;
  region: string;
  visits: number;
  checkins: number;
  favorites: number;
  growth: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <MapPin className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">
            {category} • {region}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-8 text-center">
        <div>
          <div className="font-medium">{visits.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">訪問</div>
        </div>
        <div>
          <div className="font-medium">{checkins}</div>
          <div className="text-xs text-muted-foreground">チェックイン</div>
        </div>
        <div>
          <div className="font-medium">{favorites}</div>
          <div className="text-xs text-muted-foreground">お気に入り</div>
        </div>
      </div>
      <div className="text-green-600 font-medium">{growth}</div>
    </div>
  );
}

function UserStatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function UserBehaviorItem({
  action,
  count,
  percentage,
}: {
  action: string;
  count: number;
  percentage: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{action}</span>
        <span className="text-sm text-muted-foreground">
          {count.toLocaleString()} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
