import {
  BarChart3,
  Calendar,
  Download,
  FileText,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
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
  title: "レポート - 管理者 - Kissa",
  description: "システム全体のレポートと分析データを確認します",
};

interface ReportsPageProps {
  searchParams: Promise<{
    tab?: string;
    period?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
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

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">レポート</h1>
            <p className="text-muted-foreground">
              システム全体のレポートと分析データを確認します
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="7d">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">今日</SelectItem>
                <SelectItem value="7d">過去7日</SelectItem>
                <SelectItem value="30d">過去30日</SelectItem>
                <SelectItem value="90d">過去90日</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              エクスポート
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                総ユーザー数
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,456</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.2% 先月比
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                総コンテンツ数
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28,459</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% 先月比
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">月間訪問数</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">145,234</div>
              <div className="flex items-center text-xs text-red-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                -2.1% 先月比
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                レポート生成数
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15.3% 先月比
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" asChild>
              <Link href="/admin/reports?tab=overview">概要</Link>
            </TabsTrigger>
            <TabsTrigger value="users" asChild>
              <Link href="/admin/reports?tab=users">ユーザー</Link>
            </TabsTrigger>
            <TabsTrigger value="content" asChild>
              <Link href="/admin/reports?tab=content">コンテンツ</Link>
            </TabsTrigger>
            <TabsTrigger value="performance" asChild>
              <Link href="/admin/reports?tab=performance">パフォーマンス</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>アクティビティサマリー</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ReportMetric
                      label="新規ユーザー登録"
                      value="234"
                      change="+12%"
                      period="今週"
                    />
                    <ReportMetric
                      label="新規地域作成"
                      value="45"
                      change="+8%"
                      period="今週"
                    />
                    <ReportMetric
                      label="新規場所作成"
                      value="167"
                      change="+23%"
                      period="今週"
                    />
                    <ReportMetric
                      label="チェックイン数"
                      value="1,234"
                      change="+15%"
                      period="今週"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>システム統計</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ReportMetric
                      label="アクティブセッション"
                      value="1,856"
                      change="+5%"
                      period="現在"
                    />
                    <ReportMetric
                      label="API呼び出し"
                      value="45,678"
                      change="+18%"
                      period="今日"
                    />
                    <ReportMetric
                      label="エラー率"
                      value="0.02%"
                      change="-25%"
                      period="今日"
                    />
                    <ReportMetric
                      label="平均応答時間"
                      value="245ms"
                      change="-8%"
                      period="今日"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ユーザー成長</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        ユーザー成長グラフ（実装予定）
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ユーザー活動統計</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <UserActivityMetric
                      label="日間アクティブユーザー"
                      value="3,456"
                      percentage={78}
                    />
                    <UserActivityMetric
                      label="週間アクティブユーザー"
                      value="8,234"
                      percentage={65}
                    />
                    <UserActivityMetric
                      label="月間アクティブユーザー"
                      value="12,456"
                      percentage={45}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>コンテンツ統計</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ContentStatistic
                      type="地域"
                      total={1234}
                      pending={23}
                      approved={1156}
                      rejected={55}
                    />
                    <ContentStatistic
                      type="場所"
                      total={8567}
                      pending={156}
                      approved={7934}
                      rejected={477}
                    />
                    <ContentStatistic
                      type="チェックイン"
                      total={45678}
                      pending={234}
                      approved={44167}
                      rejected={1277}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>人気コンテンツ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <PopularContentItem
                      rank={1}
                      name="渋谷区"
                      type="地域"
                      visits={15234}
                      checkins={2456}
                    />
                    <PopularContentItem
                      rank={2}
                      name="新宿区"
                      type="地域"
                      visits={12567}
                      checkins={1987}
                    />
                    <PopularContentItem
                      rank={3}
                      name="スターバックス渋谷店"
                      type="場所"
                      visits={8934}
                      checkins={1345}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>パフォーマンス指標</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <PerformanceMetric
                      metric="ページ読み込み時間"
                      value="1.2s"
                      status="良好"
                      trend="improving"
                    />
                    <PerformanceMetric
                      metric="API応答時間"
                      value="245ms"
                      status="良好"
                      trend="stable"
                    />
                    <PerformanceMetric
                      metric="データベース応答時間"
                      value="45ms"
                      status="優秀"
                      trend="improving"
                    />
                    <PerformanceMetric
                      metric="稼働率"
                      value="99.9%"
                      status="優秀"
                      trend="stable"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>システム使用率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <SystemUsageMetric label="CPU使用率" value={23} unit="%" />
                    <SystemUsageMetric
                      label="メモリ使用率"
                      value={67}
                      unit="%"
                    />
                    <SystemUsageMetric
                      label="ディスク使用率"
                      value={45}
                      unit="%"
                    />
                    <SystemUsageMetric
                      label="ネットワーク使用率"
                      value={12}
                      unit="%"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Component functions
function ReportMetric({
  label,
  value,
  change,
  period,
}: {
  label: string;
  value: string;
  change: string;
  period: string;
}) {
  const isPositive = change.startsWith("+");
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{period}</div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold">{value}</div>
        <div
          className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}
        >
          {change}
        </div>
      </div>
    </div>
  );
}

function UserActivityMetric({
  label,
  value,
  percentage,
}: {
  label: string;
  value: string;
  percentage: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ContentStatistic({
  type,
  total,
  pending,
  approved,
  rejected,
}: {
  type: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="font-medium mb-2">{type}</div>
      <div className="grid grid-cols-4 gap-2 text-sm">
        <div className="text-center">
          <div className="font-bold">{total.toLocaleString()}</div>
          <div className="text-muted-foreground">総数</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-orange-600">{pending}</div>
          <div className="text-muted-foreground">保留</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-green-600">
            {approved.toLocaleString()}
          </div>
          <div className="text-muted-foreground">承認</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-red-600">{rejected}</div>
          <div className="text-muted-foreground">却下</div>
        </div>
      </div>
    </div>
  );
}

function PopularContentItem({
  rank,
  name,
  type,
  visits,
  checkins,
}: {
  rank: number;
  name: string;
  type: string;
  visits: number;
  checkins: number;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
          {rank}
        </div>
        <div>
          <div className="font-medium">{name}</div>
          <Badge variant="outline" className="text-xs">
            {type}
          </Badge>
        </div>
      </div>
      <div className="text-right text-sm">
        <div className="font-medium">{visits.toLocaleString()} 訪問</div>
        <div className="text-muted-foreground">
          {checkins.toLocaleString()} チェックイン
        </div>
      </div>
    </div>
  );
}

function PerformanceMetric({
  metric,
  value,
  status,
  trend,
}: {
  metric: string;
  value: string;
  status: string;
  trend: "improving" | "stable" | "declining";
}) {
  const statusColor =
    {
      優秀: "text-green-600",
      良好: "text-blue-600",
      注意: "text-orange-600",
      危険: "text-red-600",
    }[status] || "text-gray-600";

  const trendIcon = {
    improving: <TrendingUp className="h-3 w-3 text-green-600" />,
    stable: <div className="h-3 w-3 bg-gray-400 rounded-full" />,
    declining: <TrendingDown className="h-3 w-3 text-red-600" />,
  }[trend];

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{metric}</div>
        <div className={`text-sm ${statusColor}`}>{status}</div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="text-lg font-bold">{value}</div>
        {trendIcon}
      </div>
    </div>
  );
}

function SystemUsageMetric({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  const getColor = (value: number) => {
    if (value < 50) return "bg-green-600";
    if (value < 80) return "bg-orange-600";
    return "bg-red-600";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">
          {value}
          {unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${getColor(value)} h-2 rounded-full transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
