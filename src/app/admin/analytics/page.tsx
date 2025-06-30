import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  LineChart,
  PieChart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { AdminLayout } from "@/components/layout";
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
  title: "分析 - 管理者 - Kissa",
  description: "詳細なデータ分析とビジネスインサイト",
};

interface AnalyticsPageProps {
  searchParams: Promise<{
    tab?: string;
    period?: string;
  }>;
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const { result: user, error } = await getCurrentUserAction();

  if (error) {
    console.error("Failed to get current user:", error);
  }

  if (!user || !UserDomain.hasMinimumRole(user, "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">アクセス権限がありません</h1>
          <p className="text-muted-foreground mb-4">
            このページにアクセスするには管理者権限が必要です。
          </p>
          <Button asChild>
            <Link href="/dashboard">ダッシュボードに戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const activeTab = params.tab || "overview";
  const period = params.period || "30d";

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">分析</h1>
            <p className="text-muted-foreground">
              詳細なデータ分析とビジネスインサイト
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue={period}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="期間を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">過去7日間</SelectItem>
                <SelectItem value="30d">過去30日間</SelectItem>
                <SelectItem value="90d">過去90日間</SelectItem>
                <SelectItem value="1y">過去1年間</SelectItem>
                <SelectItem value="custom">カスタム期間</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              フィルター
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              エクスポート
            </Button>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                リアルタイムユーザー
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">247</div>
              <p className="text-xs text-muted-foreground">現在オンライン</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                ページビュー
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234,567</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.3% 前日比
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">セッション</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98,765</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.7% 前日比
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">直帰率</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">34.2%</div>
              <div className="flex items-center text-xs text-red-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                -2.1% 前日比
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                平均セッション時間
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5m 42s</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15.3% 前日比
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" asChild>
              <Link href="/admin/analytics?tab=overview">概要</Link>
            </TabsTrigger>
            <TabsTrigger value="behavior" asChild>
              <Link href="/admin/analytics?tab=behavior">行動分析</Link>
            </TabsTrigger>
            <TabsTrigger value="acquisition" asChild>
              <Link href="/admin/analytics?tab=acquisition">獲得分析</Link>
            </TabsTrigger>
            <TabsTrigger value="conversion" asChild>
              <Link href="/admin/analytics?tab=conversion">コンバージョン</Link>
            </TabsTrigger>
            <TabsTrigger value="cohort" asChild>
              <Link href="/admin/analytics?tab=cohort">コホート分析</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Traffic Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="h-5 w-5" />
                    <span>トラフィック概要</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        インタラクティブチャート
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Chart.js / Recharts 統合予定
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Pages */}
              <Card>
                <CardHeader>
                  <CardTitle>人気ページ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <TopPageItem
                      path="/"
                      title="ホームページ"
                      views={45678}
                      bounceRate={32.1}
                      avgTime="2m 15s"
                    />
                    <TopPageItem
                      path="/regions"
                      title="地域一覧"
                      views={34567}
                      bounceRate={28.9}
                      avgTime="3m 42s"
                    />
                    <TopPageItem
                      path="/places/123"
                      title="渋谷スカイ"
                      views={23456}
                      bounceRate={25.3}
                      avgTime="4m 18s"
                    />
                    <TopPageItem
                      path="/auth/login"
                      title="ログインページ"
                      views={12345}
                      bounceRate={45.7}
                      avgTime="1m 23s"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Device and Browser Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>デバイス分布</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DeviceStatItem
                    device="デスクトップ"
                    percentage={45.2}
                    count={567890}
                  />
                  <DeviceStatItem
                    device="モバイル"
                    percentage={42.8}
                    count={537892}
                  />
                  <DeviceStatItem
                    device="タブレット"
                    percentage={12.0}
                    count={150678}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>OS分布</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <OSStatItem os="Windows" percentage={35.4} count={445234} />
                  <OSStatItem os="iOS" percentage={28.7} count={360892} />
                  <OSStatItem os="Android" percentage={22.3} count={280234} />
                  <OSStatItem os="macOS" percentage={13.6} count={171100} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ブラウザ分布</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BrowserStatItem
                    browser="Chrome"
                    percentage={52.1}
                    count={655892}
                  />
                  <BrowserStatItem
                    browser="Safari"
                    percentage={25.3}
                    count={318234}
                  />
                  <BrowserStatItem
                    browser="Firefox"
                    percentage={12.4}
                    count={156012}
                  />
                  <BrowserStatItem
                    browser="Edge"
                    percentage={10.2}
                    count={128322}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Flow */}
              <Card>
                <CardHeader>
                  <CardTitle>ユーザーフロー分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        ユーザーフロー可視化
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Heat Map */}
              <Card>
                <CardHeader>
                  <CardTitle>ヒートマップ分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        クリックヒートマップ
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="acquisition" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>流入元分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <AcquisitionSourceItem
                    source="オーガニック検索"
                    sessions={45678}
                    percentage={42.3}
                    newUsers={67}
                  />
                  <AcquisitionSourceItem
                    source="ダイレクト"
                    sessions={34567}
                    percentage={32.1}
                    newUsers={89}
                  />
                  <AcquisitionSourceItem
                    source="SNS"
                    sessions={23456}
                    percentage={21.7}
                    newUsers={75}
                  />
                  <AcquisitionSourceItem
                    source="リファラル"
                    sessions={4321}
                    percentage={3.9}
                    newUsers={45}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>コンバージョンファネル</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <FunnelStepItem
                      step="訪問者"
                      count={108000}
                      percentage={100}
                      dropoff={0}
                    />
                    <FunnelStepItem
                      step="ユーザー登録"
                      count={5400}
                      percentage={5.0}
                      dropoff={95.0}
                    />
                    <FunnelStepItem
                      step="初回チェックイン"
                      count={3780}
                      percentage={3.5}
                      dropoff={30.0}
                    />
                    <FunnelStepItem
                      step="サブスクリプション"
                      count={324}
                      percentage={0.3}
                      dropoff={91.4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>コンバージョン率推移</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        コンバージョン率チャート
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cohort" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>コホート分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      ユーザーリテンション分析
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      月次・週次コホートテーブル
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function TopPageItem({
  path,
  title,
  views,
  bounceRate,
  avgTime,
}: {
  path: string;
  title: string;
  views: number;
  bounceRate: number;
  avgTime: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{path}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">
          {views.toLocaleString()} ビュー
        </div>
        <div className="text-xs text-muted-foreground">
          直帰率: {bounceRate}% • 滞在: {avgTime}
        </div>
      </div>
    </div>
  );
}

function DeviceStatItem({
  device,
  percentage,
  count,
}: {
  device: string;
  percentage: number;
  count: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{device}</span>
        <span className="text-sm text-muted-foreground">{percentage}%</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-16 text-right">
          {count.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function OSStatItem({
  os,
  percentage,
  count,
}: {
  os: string;
  percentage: number;
  count: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{os}</span>
        <span className="text-sm text-muted-foreground">{percentage}%</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-16 text-right">
          {count.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function BrowserStatItem({
  browser,
  percentage,
  count,
}: {
  browser: string;
  percentage: number;
  count: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{browser}</span>
        <span className="text-sm text-muted-foreground">{percentage}%</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-16 text-right">
          {count.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function AcquisitionSourceItem({
  source,
  sessions,
  percentage,
  newUsers,
}: {
  source: string;
  sessions: number;
  percentage: number;
  newUsers: number;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <div className="font-medium">{source}</div>
        <div className="text-sm text-muted-foreground">
          新規ユーザー率: {newUsers}%
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{sessions.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">{percentage}%</div>
      </div>
    </div>
  );
}

function FunnelStepItem({
  step,
  count,
  percentage,
  dropoff,
}: {
  step: string;
  count: number;
  percentage: number;
  dropoff: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{step}</span>
        <div className="text-right">
          <span className="text-sm font-bold">{count.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground ml-2">
            ({percentage}%)
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex-1 bg-muted rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {dropoff > 0 && (
          <span className="text-xs text-red-600">-{dropoff}%</span>
        )}
      </div>
    </div>
  );
}
