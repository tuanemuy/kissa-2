import {
  AlertTriangle,
  Clock,
  Database,
  Download,
  HardDrive,
  Plus,
  RefreshCw,
  Server,
  Shield,
  Trash2,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "メンテナンス - 管理者 - Kissa",
  description: "システムメンテナンス・バックアップ・データベース管理",
};

interface MaintenancePageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function MaintenancePage({
  searchParams,
}: MaintenancePageProps) {
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
            <h1 className="text-3xl font-bold mb-2">メンテナンス</h1>
            <p className="text-muted-foreground">
              システムメンテナンス・バックアップ・データベース管理
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  メンテナンスモード
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>メンテナンスモード</DialogTitle>
                  <DialogDescription>
                    システムをメンテナンスモードに切り替えます。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="maintenance-duration">予定時間</Label>
                    <Select defaultValue="1h">
                      <SelectTrigger>
                        <SelectValue placeholder="時間を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30m">30分</SelectItem>
                        <SelectItem value="1h">1時間</SelectItem>
                        <SelectItem value="2h">2時間</SelectItem>
                        <SelectItem value="4h">4時間</SelectItem>
                        <SelectItem value="custom">カスタム</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maintenance-message">
                      メンテナンス通知
                    </Label>
                    <Textarea
                      id="maintenance-message"
                      placeholder="ユーザーに表示するメッセージを入力..."
                      defaultValue="システムメンテナンスのため、一時的にサービスを停止しています。"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" variant="destructive">
                    メンテナンスモード開始
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              システム再起動
            </Button>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                システム稼働時間
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15d 8h 42m</div>
              <p className="text-xs text-muted-foreground">前回再起動から</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU使用率</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23.4%</div>
              <Progress value={23.4} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                メモリ使用率
              </CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">67.8%</div>
              <Progress value={67.8} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                ディスク使用率
              </CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45.2%</div>
              <Progress value={45.2} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" asChild>
              <Link href="/admin/maintenance?tab=overview">概要</Link>
            </TabsTrigger>
            <TabsTrigger value="backup" asChild>
              <Link href="/admin/maintenance?tab=backup">バックアップ</Link>
            </TabsTrigger>
            <TabsTrigger value="database" asChild>
              <Link href="/admin/maintenance?tab=database">データベース</Link>
            </TabsTrigger>
            <TabsTrigger value="logs" asChild>
              <Link href="/admin/maintenance?tab=logs">ログ</Link>
            </TabsTrigger>
            <TabsTrigger value="schedule" asChild>
              <Link href="/admin/maintenance?tab=schedule">スケジュール</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>システムヘルス</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <HealthIndicator
                    label="Webサーバー"
                    status="healthy"
                    value="正常稼働中"
                    lastCheck="2分前"
                  />
                  <HealthIndicator
                    label="データベース"
                    status="healthy"
                    value="応答良好"
                    lastCheck="30秒前"
                  />
                  <HealthIndicator
                    label="ファイルストレージ"
                    status="warning"
                    value="容量注意"
                    lastCheck="1分前"
                  />
                  <HealthIndicator
                    label="外部API"
                    status="healthy"
                    value="接続確認済み"
                    lastCheck="5分前"
                  />
                  <HealthIndicator
                    label="メール送信"
                    status="healthy"
                    value="送信可能"
                    lastCheck="10分前"
                  />
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>最近のメンテナンス活動</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <MaintenanceActivity
                      title="自動バックアップ実行"
                      description="データベースとファイルの定期バックアップが完了"
                      timestamp="2024-12-30T02:00:00Z"
                      status="success"
                    />
                    <MaintenanceActivity
                      title="セキュリティアップデート"
                      description="システムライブラリの更新を実行"
                      timestamp="2024-12-29T03:30:00Z"
                      status="success"
                    />
                    <MaintenanceActivity
                      title="ログファイル整理"
                      description="古いログファイルを圧縮・アーカイブ"
                      timestamp="2024-12-28T01:15:00Z"
                      status="success"
                    />
                    <MaintenanceActivity
                      title="データベース最適化"
                      description="インデックスの再構築とクエリ最適化"
                      timestamp="2024-12-27T04:00:00Z"
                      status="warning"
                    />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button className="h-24 flex flex-col items-center justify-center">
                    <Database className="h-6 w-6 mb-2" />
                    <span>DB最適化</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center"
                  >
                    <Trash2 className="h-6 w-6 mb-2" />
                    <span>ログ削除</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center"
                  >
                    <RefreshCw className="h-6 w-6 mb-2" />
                    <span>キャッシュクリア</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center"
                  >
                    <Download className="h-6 w-6 mb-2" />
                    <span>バックアップ</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Backup Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>バックアップ設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">自動バックアップ</div>
                      <div className="text-sm text-muted-foreground">
                        定期的な自動バックアップを実行
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label>バックアップ頻度</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">毎時</SelectItem>
                        <SelectItem value="daily">毎日</SelectItem>
                        <SelectItem value="weekly">毎週</SelectItem>
                        <SelectItem value="monthly">毎月</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>保持期間</Label>
                    <Select defaultValue="30d">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">7日</SelectItem>
                        <SelectItem value="30d">30日</SelectItem>
                        <SelectItem value="90d">90日</SelectItem>
                        <SelectItem value="1y">1年</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>バックアップ場所</Label>
                    <Select defaultValue="s3">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">
                          ローカルストレージ
                        </SelectItem>
                        <SelectItem value="s3">Amazon S3</SelectItem>
                        <SelectItem value="gcs">
                          Google Cloud Storage
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Backup */}
              <Card>
                <CardHeader>
                  <CardTitle>手動バックアップ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>バックアップ種類</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="backup-db" defaultChecked />
                        <Label htmlFor="backup-db">データベース</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="backup-files"
                          defaultChecked
                        />
                        <Label htmlFor="backup-files">ファイルストレージ</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="backup-config" />
                        <Label htmlFor="backup-config">設定ファイル</Label>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    バックアップ開始
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    最後のバックアップ: 2024-12-30 02:00 JST
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Backup History */}
            <Card>
              <CardHeader>
                <CardTitle>バックアップ履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getBackupHistory().map((backup) => (
                    <BackupHistoryItem key={backup.id} backup={backup} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Database Status */}
              <Card>
                <CardHeader>
                  <CardTitle>データベース状態</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">接続数</Label>
                      <div className="text-2xl font-bold">24</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        実行中クエリ
                      </Label>
                      <div className="text-2xl font-bold">3</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        データベースサイズ
                      </Label>
                      <div className="text-2xl font-bold">2.4GB</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        インデックスサイズ
                      </Label>
                      <div className="text-2xl font-bold">456MB</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>最近のクエリパフォーマンス</Label>
                    <Progress value={85} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      平均応答時間: 45ms
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Database Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>データベース操作</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    インデックス再構築
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    統計情報更新
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Trash2 className="h-4 w-4 mr-2" />
                    古いデータ削除
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Zap className="h-4 w-4 mr-2" />
                    クエリ最適化
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    スキーマエクスポート
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Table Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>テーブル統計</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getDatabaseTables().map((table) => (
                    <TableStatItem key={table.name} table={table} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>システムログ</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="error">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全レベル</SelectItem>
                        <SelectItem value="error">エラーのみ</SelectItem>
                        <SelectItem value="warning">警告以上</SelectItem>
                        <SelectItem value="info">情報以上</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      ダウンロード
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                  <div className="space-y-1">
                    <div>
                      2024-12-30 10:45:23 [INFO] User login: user@example.com
                    </div>
                    <div>
                      2024-12-30 10:44:15 [INFO] Database backup completed
                      successfully
                    </div>
                    <div>
                      2024-12-30 10:42:08 [WARNING] High memory usage detected:
                      85%
                    </div>
                    <div>
                      2024-12-30 10:40:33 [INFO] Content approval: region/123
                    </div>
                    <div>
                      2024-12-30 10:38:12 [ERROR] Failed to send email
                      notification
                    </div>
                    <div>
                      2024-12-30 10:35:45 [INFO] New user registration:
                      newuser@example.com
                    </div>
                    <div>
                      2024-12-30 10:33:22 [INFO] Cache cleared successfully
                    </div>
                    <div>
                      2024-12-30 10:30:11 [WARNING] API rate limit exceeded for
                      IP: 192.168.1.100
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scheduled Tasks */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>スケジュール済みタスク</CardTitle>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      追加
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getScheduledTasks().map((task) => (
                      <ScheduledTaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Maintenance */}
              <Card>
                <CardHeader>
                  <CardTitle>予定されたメンテナンス</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">定期メンテナンス</div>
                          <div className="text-sm text-muted-foreground">
                            データベース最適化とシステム更新
                          </div>
                        </div>
                        <Badge variant="outline">2025-01-01</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        予定時間: 2:00 - 4:00 JST
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">セキュリティ更新</div>
                          <div className="text-sm text-muted-foreground">
                            システムライブラリの更新
                          </div>
                        </div>
                        <Badge variant="outline">2025-01-15</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        予定時間: 3:00 - 3:30 JST
                      </div>
                    </div>
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
function HealthIndicator({
  label,
  status,
  value,
  lastCheck,
}: {
  label: string;
  status: "healthy" | "warning" | "error";
  value: string;
  lastCheck: string;
}) {
  const statusConfig = {
    healthy: { color: "text-green-600", bg: "bg-green-100" },
    warning: { color: "text-orange-600", bg: "bg-orange-100" },
    error: { color: "text-red-600", bg: "bg-red-100" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${config.bg}`} />
        <div>
          <div className="font-medium">{label}</div>
          <div className={`text-sm ${config.color}`}>{value}</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{lastCheck}</div>
    </div>
  );
}

function MaintenanceActivity({
  title,
  description,
  timestamp,
  status,
}: {
  title: string;
  description: string;
  timestamp: string;
  status: "success" | "warning" | "error";
}) {
  const statusConfig = {
    success: { icon: "✓", color: "text-green-600" },
    warning: { icon: "⚠", color: "text-orange-600" },
    error: { icon: "✗", color: "text-red-600" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-start space-x-3">
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm ${config.color}`}
      >
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
        <div className="text-xs text-muted-foreground">
          {new Date(timestamp).toLocaleString("ja-JP")}
        </div>
      </div>
    </div>
  );
}

function BackupHistoryItem({
  backup,
}: {
  backup: {
    id: string;
    type: string;
    size: string;
    status: string;
    createdAt: string;
    location: string;
  };
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <Database className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="font-medium">{backup.type}</div>
          <div className="text-sm text-muted-foreground">
            {backup.size} • {backup.location}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm">
          {new Date(backup.createdAt).toLocaleDateString("ja-JP")}
        </div>
        <Badge
          variant={backup.status === "completed" ? "default" : "destructive"}
        >
          {backup.status === "completed" ? "完了" : "失敗"}
        </Badge>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function TableStatItem({
  table,
}: {
  table: {
    name: string;
    rows: number;
    size: string;
    lastUpdate: string;
  };
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <div className="font-medium">{table.name}</div>
        <div className="text-sm text-muted-foreground">
          {table.rows.toLocaleString()} 行 • {table.size}
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {new Date(table.lastUpdate).toLocaleDateString("ja-JP")}
      </div>
    </div>
  );
}

function ScheduledTaskItem({
  task,
}: {
  task: {
    id: string;
    name: string;
    schedule: string;
    nextRun: string;
    enabled: boolean;
  };
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        <Switch checked={task.enabled} />
        <div>
          <div className="font-medium">{task.name}</div>
          <div className="text-sm text-muted-foreground">{task.schedule}</div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        次回: {new Date(task.nextRun).toLocaleString("ja-JP")}
      </div>
    </div>
  );
}

// Mock data functions
function getBackupHistory() {
  return [
    {
      id: "1",
      type: "フルバックアップ",
      size: "2.4GB",
      status: "completed",
      createdAt: "2024-12-30T02:00:00Z",
      location: "AWS S3",
    },
    {
      id: "2",
      type: "データベースバックアップ",
      size: "1.8GB",
      status: "completed",
      createdAt: "2024-12-29T02:00:00Z",
      location: "AWS S3",
    },
    {
      id: "3",
      type: "フルバックアップ",
      size: "2.3GB",
      status: "completed",
      createdAt: "2024-12-28T02:00:00Z",
      location: "AWS S3",
    },
  ];
}

function getDatabaseTables() {
  return [
    {
      name: "users",
      rows: 12456,
      size: "45.2MB",
      lastUpdate: "2024-12-30T10:30:00Z",
    },
    {
      name: "regions",
      rows: 3892,
      size: "12.8MB",
      lastUpdate: "2024-12-30T09:15:00Z",
    },
    {
      name: "places",
      rows: 24567,
      size: "156.3MB",
      lastUpdate: "2024-12-30T08:45:00Z",
    },
    {
      name: "checkins",
      rows: 89234,
      size: "234.7MB",
      lastUpdate: "2024-12-30T10:15:00Z",
    },
  ];
}

function getScheduledTasks() {
  return [
    {
      id: "1",
      name: "データベースバックアップ",
      schedule: "毎日 2:00 AM",
      nextRun: "2024-12-31T02:00:00Z",
      enabled: true,
    },
    {
      id: "2",
      name: "ログファイル圧縮",
      schedule: "毎週日曜 1:00 AM",
      nextRun: "2025-01-05T01:00:00Z",
      enabled: true,
    },
    {
      id: "3",
      name: "古いデータ削除",
      schedule: "毎月1日 3:00 AM",
      nextRun: "2025-01-01T03:00:00Z",
      enabled: true,
    },
    {
      id: "4",
      name: "システム統計更新",
      schedule: "毎時",
      nextRun: "2024-12-30T11:00:00Z",
      enabled: true,
    },
  ];
}
