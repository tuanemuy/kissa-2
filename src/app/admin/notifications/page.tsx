import {
  Bell,
  BellRing,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Save,
  Send,
  Settings,
  Smartphone,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "通知設定 - 管理者 - Kissa",
  description: "システム通知の設定と管理を行います",
};

interface NotificationsPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
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
  const activeTab = params.tab || "settings";

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">通知設定</h1>
            <p className="text-muted-foreground">
              システム通知の設定と管理を行います
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" />
              テスト送信
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              設定を保存
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                今日の送信数
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                メール・プッシュ通知
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">開封率</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68.5%</div>
              <p className="text-xs text-muted-foreground">メール開封率</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                プッシュ登録
              </CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,456</div>
              <p className="text-xs text-muted-foreground">
                プッシュ通知有効ユーザー
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">未読通知</CardTitle>
              <BellRing className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">管理者宛て未読</p>
            </CardContent>
          </Card>
        </div>

        {/* Notification Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings" asChild>
              <Link href="/admin/notifications?tab=settings">通知設定</Link>
            </TabsTrigger>
            <TabsTrigger value="templates" asChild>
              <Link href="/admin/notifications?tab=templates">
                テンプレート
              </Link>
            </TabsTrigger>
            <TabsTrigger value="channels" asChild>
              <Link href="/admin/notifications?tab=channels">配信チャネル</Link>
            </TabsTrigger>
            <TabsTrigger value="history" asChild>
              <Link href="/admin/notifications?tab=history">送信履歴</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Notifications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <CardTitle>システム通知</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">新規ユーザー登録</div>
                      <div className="text-sm text-muted-foreground">
                        新しいユーザーが登録した際に管理者に通知
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">コンテンツ申請</div>
                      <div className="text-sm text-muted-foreground">
                        新しい地域・場所の申請があった際に通知
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">報告通知</div>
                      <div className="text-sm text-muted-foreground">
                        不適切なコンテンツの報告があった際に通知
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">システムエラー</div>
                      <div className="text-sm text-muted-foreground">
                        システムエラーが発生した際に即座に通知
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">セキュリティ警告</div>
                      <div className="text-sm text-muted-foreground">
                        不正アクセスや異常なログイン試行を検知
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* User Notifications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <CardTitle>ユーザー通知</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">ウェルカムメール</div>
                      <div className="text-sm text-muted-foreground">
                        新規ユーザーへのウェルカムメール送信
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">パスワードリセット</div>
                      <div className="text-sm text-muted-foreground">
                        パスワードリセット用のメール送信
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">コンテンツ承認通知</div>
                      <div className="text-sm text-muted-foreground">
                        申請したコンテンツの承認・却下結果を通知
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">アクティビティ通知</div>
                      <div className="text-sm text-muted-foreground">
                        お気に入り地域の新しいチェックインを通知
                      </div>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">マーケティングメール</div>
                      <div className="text-sm text-muted-foreground">
                        プロモーションやニュースレターの送信
                      </div>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timing Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <CardTitle>配信タイミング設定</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>緊急通知の配信時間</Label>
                    <Select defaultValue="immediate">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">即座に送信</SelectItem>
                        <SelectItem value="5min">5分後に送信</SelectItem>
                        <SelectItem value="15min">15分後に送信</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>一般通知の配信時間</Label>
                    <Select defaultValue="batch">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">即座に送信</SelectItem>
                        <SelectItem value="batch">
                          バッチ送信（1時間毎）
                        </SelectItem>
                        <SelectItem value="daily">日次送信</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>マーケティングメール配信時間</Label>
                    <Select defaultValue="10am">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9am">9:00 AM</SelectItem>
                        <SelectItem value="10am">10:00 AM</SelectItem>
                        <SelectItem value="2pm">2:00 PM</SelectItem>
                        <SelectItem value="7pm">7:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>配信除外時間帯</Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="quiet-start">開始時刻</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        defaultValue="22:00"
                        className="w-24"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="quiet-end">終了時刻</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        defaultValue="08:00"
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getNotificationTemplates().map((template) => (
                <NotificationTemplateCard
                  key={template.id}
                  template={template}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="channels" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <CardTitle>メール設定</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTPホスト</Label>
                    <Input
                      id="smtp-host"
                      defaultValue="smtp.gmail.com"
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">ポート</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        defaultValue="587"
                        placeholder="587"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-encryption">暗号化</Label>
                      <Select defaultValue="tls">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">なし</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">ユーザー名</Label>
                    <Input
                      id="smtp-username"
                      defaultValue="noreply@kissa.example.com"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">パスワード</Label>
                    <Input
                      id="smtp-password"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-email">送信者メールアドレス</Label>
                    <Input
                      id="from-email"
                      type="email"
                      defaultValue="noreply@kissa.example.com"
                      placeholder="noreply@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-name">送信者名</Label>
                    <Input
                      id="from-name"
                      defaultValue="Kissa"
                      placeholder="Your App Name"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Push Notification Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5" />
                    <CardTitle>プッシュ通知設定</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fcm-server-key">FCM サーバーキー</Label>
                    <Input
                      id="fcm-server-key"
                      type="password"
                      placeholder="AAAAxxxxxxx..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apns-cert">APNS 証明書</Label>
                    <Input id="apns-cert" type="file" accept=".p12,.pem" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apns-password">APNS パスワード</Label>
                    <Input
                      id="apns-password"
                      type="password"
                      placeholder="証明書のパスワード"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">プッシュ通知を有効化</div>
                      <div className="text-sm text-muted-foreground">
                        モバイルアプリへのプッシュ通知
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">バッジ数を更新</div>
                      <div className="text-sm text-muted-foreground">
                        アプリアイコンのバッジ数を更新
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* SMS Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <CardTitle>SMS設定</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sms-provider">SMSプロバイダー</Label>
                    <Select defaultValue="twilio">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="aws-sns">AWS SNS</SelectItem>
                        <SelectItem value="nexmo">Nexmo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sms-api-key">APIキー</Label>
                    <Input
                      id="sms-api-key"
                      type="password"
                      placeholder="APIキーを入力"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sms-sender-id">送信者ID</Label>
                    <Input
                      id="sms-sender-id"
                      defaultValue="Kissa"
                      placeholder="送信者名"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">SMS通知を有効化</div>
                      <div className="text-sm text-muted-foreground">
                        緊急時のSMS通知（管理者のみ）
                      </div>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              {/* Slack Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <CardTitle>Slack連携</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slack-webhook">Webhook URL</Label>
                    <Input
                      id="slack-webhook"
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slack-channel">チャンネル</Label>
                    <Input
                      id="slack-channel"
                      defaultValue="#alerts"
                      placeholder="#channel-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slack-username">ボット名</Label>
                    <Input
                      id="slack-username"
                      defaultValue="Kissa Bot"
                      placeholder="Bot Username"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">Slack通知を有効化</div>
                      <div className="text-sm text-muted-foreground">
                        管理者チームへのSlack通知
                      </div>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>通知送信履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getNotificationHistory().map((notification) => (
                    <NotificationHistoryItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function NotificationTemplateCard({
  template,
}: {
  template: {
    id: string;
    name: string;
    type: string;
    subject: string;
    description: string;
    lastUpdated: string;
    isActive: boolean;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline">{template.type}</Badge>
              {template.isActive ? (
                <Badge variant="default">有効</Badge>
              ) : (
                <Badge variant="secondary">無効</Badge>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm">
            編集
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">件名</Label>
          <p className="text-sm text-muted-foreground">{template.subject}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">説明</Label>
          <p className="text-sm text-muted-foreground">
            {template.description}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          最終更新: {new Date(template.lastUpdated).toLocaleDateString("ja-JP")}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationHistoryItem({
  notification,
}: {
  notification: {
    id: string;
    type: string;
    subject: string;
    recipients: number;
    channel: string;
    status: string;
    sentAt: string;
    openRate?: number;
  };
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <div>
          <div className="font-medium">{notification.subject}</div>
          <div className="text-sm text-muted-foreground">
            {notification.recipients.toLocaleString()} 件送信 •{" "}
            {notification.channel}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-sm">
            {new Date(notification.sentAt).toLocaleDateString("ja-JP")}
          </div>
          <div className="text-xs text-muted-foreground">
            {notification.openRate && `開封率: ${notification.openRate}%`}
          </div>
        </div>
        <NotificationStatusBadge status={notification.status} />
      </div>
    </div>
  );
}

function NotificationStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    sent: { label: "送信済み", variant: "default" as const },
    failed: { label: "送信失敗", variant: "destructive" as const },
    pending: { label: "送信中", variant: "secondary" as const },
    scheduled: { label: "予約済み", variant: "outline" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Mock data functions
function getNotificationTemplates() {
  return [
    {
      id: "welcome",
      name: "ウェルカムメール",
      type: "メール",
      subject: "Kissaへようこそ！",
      description: "新規ユーザー向けのウェルカムメッセージ",
      lastUpdated: "2024-12-25T10:00:00Z",
      isActive: true,
    },
    {
      id: "password-reset",
      name: "パスワードリセット",
      type: "メール",
      subject: "パスワードリセットのご案内",
      description: "パスワードリセット用のリンクを含むメール",
      lastUpdated: "2024-12-20T15:30:00Z",
      isActive: true,
    },
    {
      id: "content-approved",
      name: "コンテンツ承認通知",
      type: "メール",
      subject: "あなたの投稿が承認されました",
      description: "申請されたコンテンツの承認通知",
      lastUpdated: "2024-12-18T09:15:00Z",
      isActive: true,
    },
    {
      id: "system-alert",
      name: "システムアラート",
      type: "Slack",
      subject: "システム障害が発生しました",
      description: "管理者向けのシステム障害通知",
      lastUpdated: "2024-12-15T14:45:00Z",
      isActive: true,
    },
  ];
}

function getNotificationHistory() {
  return [
    {
      id: "1",
      type: "system",
      subject: "新規ユーザー登録通知",
      recipients: 12,
      channel: "メール",
      status: "sent",
      sentAt: "2024-12-30T10:30:00Z",
      openRate: 85,
    },
    {
      id: "2",
      type: "marketing",
      subject: "週間ニュースレター",
      recipients: 8456,
      channel: "メール",
      status: "sent",
      sentAt: "2024-12-30T09:00:00Z",
      openRate: 68,
    },
    {
      id: "3",
      type: "alert",
      subject: "システム障害通知",
      recipients: 12,
      channel: "Slack",
      status: "sent",
      sentAt: "2024-12-29T15:45:00Z",
    },
    {
      id: "4",
      type: "notification",
      subject: "コンテンツ承認通知",
      recipients: 23,
      channel: "プッシュ通知",
      status: "sent",
      sentAt: "2024-12-29T14:20:00Z",
    },
  ];
}
