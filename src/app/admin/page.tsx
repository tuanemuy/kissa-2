import {
  Activity,
  AlertTriangle,
  BarChart3,
  FileText,
  MapPin,
  Settings,
  Shield,
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
import { Progress } from "@/components/ui/progress";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "管理者ダッシュボード - Kissa",
  description: "システム全体の監視と管理を行います",
};

export default async function AdminDashboardPage() {
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

  const userDisplayName = UserDomain.getDisplayName(user);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold mb-2">管理者ダッシュボード</h1>
          <p className="text-muted-foreground">
            {userDisplayName}さん、システム全体の状況を確認しましょう
          </p>
        </div>

        {/* System Status */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-800">システム状態</CardTitle>
              </div>
              <Badge variant="default" className="bg-green-600">
                正常稼働中
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatusMetric
                label="サーバー稼働率"
                value="99.9%"
                trend="up"
                color="green"
              />
              <StatusMetric
                label="応答時間"
                value="120ms"
                trend="down"
                color="green"
              />
              <StatusMetric
                label="エラー率"
                value="0.01%"
                trend="down"
                color="green"
              />
              <StatusMetric
                label="アクティブセッション"
                value="1,234"
                trend="up"
                color="blue"
              />
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
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
                +8.3% 今月
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総地域数</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3,892</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5.1% 今月
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総場所数</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24,567</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.7% 今月
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                月間チェックイン
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89,234</div>
              <div className="flex items-center text-xs text-red-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                -2.4% 今月
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <QuickActionCard
                title="ユーザー管理"
                description="ユーザーの管理と権限設定"
                icon={Users}
                href="/admin/users"
              />
              <QuickActionCard
                title="コンテンツ管理"
                description="地域・場所の承認と管理"
                icon={FileText}
                href="/admin/content"
              />
              <QuickActionCard
                title="システム設定"
                description="アプリケーション設定"
                icon={Settings}
                href="/admin/settings"
              />
              <QuickActionCard
                title="レポート"
                description="詳細な分析レポート"
                icon={BarChart3}
                href="/admin/reports"
              />
              <QuickActionCard
                title="セキュリティ"
                description="セキュリティと監査ログ"
                icon={Shield}
                href="/admin/security"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>最近のアクティビティ</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/activity">すべて見る</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ActivityItem
                  type="user"
                  title="新規ユーザー登録"
                  description="田中太郎さんが登録しました"
                  time="5分前"
                  status="info"
                />
                <ActivityItem
                  type="content"
                  title="地域申請"
                  description="「湘南エリア」の新規作成申請"
                  time="15分前"
                  status="warning"
                />
                <ActivityItem
                  type="system"
                  title="システムアップデート"
                  description="セキュリティパッチの適用完了"
                  time="1時間前"
                  status="success"
                />
                <ActivityItem
                  type="error"
                  title="エラー検出"
                  description="API応答時間の一時的な増加"
                  time="2時間前"
                  status="error"
                />
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>システムヘルス</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <HealthMetric
                  label="データベース"
                  value={98}
                  details="レスポンス良好"
                />
                <HealthMetric
                  label="API サーバー"
                  value={95}
                  details="正常稼働中"
                />
                <HealthMetric
                  label="ストレージ"
                  value={87}
                  details="使用量: 87% (要監視)"
                />
                <HealthMetric
                  label="ネットワーク"
                  value={99}
                  details="帯域幅十分"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Warnings */}
        <Card className="border-orange-200">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-800">
                注意事項・アラート
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AlertItem
                type="warning"
                message="ストレージ使用量が85%を超えています。追加容量の検討をお勧めします。"
                time="30分前"
              />
              <AlertItem
                type="info"
                message="定期メンテナンスが2025年1月5日 2:00-4:00 JST に予定されています。"
                time="1時間前"
              />
              <AlertItem
                type="success"
                message="セキュリティアップデートが正常に完了しました。"
                time="3時間前"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function StatusMetric({
  label,
  value,
  trend,
  color,
}: {
  label: string;
  value: string;
  trend: "up" | "down";
  color: "green" | "blue" | "orange" | "red";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  const colorClasses = {
    green: "text-green-600",
    blue: "text-blue-600",
    orange: "text-orange-600",
    red: "text-red-600",
  };

  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-sm text-muted-foreground flex items-center justify-center">
        <TrendIcon className="h-3 w-3 mr-1" />
        {label}
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <Link href={href} className="block">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

function ActivityItem({
  type,
  title,
  description,
  time,
  status,
}: {
  type: "user" | "content" | "system" | "error";
  title: string;
  description: string;
  time: string;
  status: "info" | "warning" | "success" | "error";
}) {
  const icons = {
    user: Users,
    content: FileText,
    system: Settings,
    error: AlertTriangle,
  };

  const statusColors = {
    info: "text-blue-600 bg-blue-100",
    warning: "text-orange-600 bg-orange-100",
    success: "text-green-600 bg-green-100",
    error: "text-red-600 bg-red-100",
  };

  const Icon = icons[type];

  return (
    <div className="flex items-start space-x-3">
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${statusColors[status]}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  );
}

function HealthMetric({
  label,
  value,
  details,
}: {
  label: string;
  value: number;
  details: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
      <p className="text-xs text-muted-foreground">{details}</p>
    </div>
  );
}

function AlertItem({
  type,
  message,
  time,
}: {
  type: "info" | "warning" | "success" | "error";
  message: string;
  time: string;
}) {
  const typeConfig = {
    info: {
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    warning: {
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    success: {
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    error: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  };

  const config = typeConfig[type];

  return (
    <div className={`p-3 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex justify-between items-start">
        <p className={`text-sm ${config.color}`}>{message}</p>
        <span className="text-xs text-muted-foreground ml-4">{time}</span>
      </div>
    </div>
  );
}
