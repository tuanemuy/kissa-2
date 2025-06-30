import {
  Bell,
  Database,
  Globe,
  Key,
  Mail,
  Palette,
  Save,
  Server,
  Settings,
  Shield,
  Upload,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { AdminLayout } from "@/components/layout";
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
import { Textarea } from "@/components/ui/textarea";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "システム設定 - 管理者 - Kissa",
  description: "アプリケーションの設定と構成を管理します",
};

interface SettingsPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
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
  const activeTab = params.tab || "general";

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">システム設定</h1>
            <p className="text-muted-foreground">
              アプリケーションの設定と構成を管理します
            </p>
          </div>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            変更を保存
          </Button>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" asChild>
              <Link href="/admin/settings?tab=general">一般</Link>
            </TabsTrigger>
            <TabsTrigger value="appearance" asChild>
              <Link href="/admin/settings?tab=appearance">外観</Link>
            </TabsTrigger>
            <TabsTrigger value="notifications" asChild>
              <Link href="/admin/settings?tab=notifications">通知</Link>
            </TabsTrigger>
            <TabsTrigger value="security" asChild>
              <Link href="/admin/settings?tab=security">セキュリティ</Link>
            </TabsTrigger>
            <TabsTrigger value="integrations" asChild>
              <Link href="/admin/settings?tab=integrations">連携</Link>
            </TabsTrigger>
            <TabsTrigger value="advanced" asChild>
              <Link href="/admin/settings?tab=advanced">高度</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <CardTitle>基本設定</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="app-name">アプリケーション名</Label>
                    <Input id="app-name" defaultValue="Kissa" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app-url">アプリケーションURL</Label>
                    <Input
                      id="app-url"
                      defaultValue="https://kissa.example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-description">アプリケーション説明</Label>
                  <Textarea
                    id="app-description"
                    defaultValue="地域と場所を発見し、共有するソーシャルプラットフォーム"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="default-language">デフォルト言語</Label>
                    <Select defaultValue="ja">
                      <SelectTrigger>
                        <SelectValue placeholder="言語を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ja">日本語</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">タイムゾーン</Label>
                    <Select defaultValue="Asia/Tokyo">
                      <SelectTrigger>
                        <SelectValue placeholder="タイムゾーンを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Tokyo">
                          Asia/Tokyo (JST)
                        </SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">
                          America/New_York (EST)
                        </SelectItem>
                        <SelectItem value="Europe/London">
                          Europe/London (GMT)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>機能設定</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">ユーザー登録を許可</div>
                    <div className="text-sm text-muted-foreground">
                      新規ユーザーの登録を受け付けます
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">メール認証を必須にする</div>
                    <div className="text-sm text-muted-foreground">
                      登録時にメールアドレスの認証を必須とします
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">管理者承認を必須にする</div>
                    <div className="text-sm text-muted-foreground">
                      新規地域・場所の作成に管理者承認を必須とします
                    </div>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">位置情報機能を有効にする</div>
                    <div className="text-sm text-muted-foreground">
                      チェックイン時の位置情報確認機能を有効にします
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <CardTitle>テーマとブランディング</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">プライマリカラー</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="primary-color"
                        type="color"
                        defaultValue="#000000"
                        className="w-16 h-10"
                      />
                      <Input defaultValue="#000000" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">セカンダリカラー</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        defaultValue="#6b7280"
                        className="w-16 h-10"
                      />
                      <Input defaultValue="#6b7280" className="flex-1" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ロゴ画像</Label>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        ファイルを選択
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG, SVG (最大 2MB)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ファビコン</Label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        ファイルを選択
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        ICO, PNG (32x32px)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <CardTitle>通知設定</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">メール通知</div>
                    <div className="text-sm text-muted-foreground">
                      システムイベントのメール通知を送信します
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">新規ユーザー登録通知</div>
                    <div className="text-sm text-muted-foreground">
                      新規ユーザーが登録した際に管理者に通知します
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">コンテンツ申請通知</div>
                    <div className="text-sm text-muted-foreground">
                      新しい地域・場所の申請があった際に通知します
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">報告通知</div>
                    <div className="text-sm text-muted-foreground">
                      不適切なコンテンツの報告があった際に通知します
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <CardTitle>メール設定</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTPホスト</Label>
                    <Input
                      id="smtp-host"
                      placeholder="smtp.example.com"
                      defaultValue="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">SMTPポート</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      placeholder="587"
                      defaultValue="587"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">ユーザー名</Label>
                    <Input
                      id="smtp-username"
                      placeholder="user@example.com"
                      defaultValue="noreply@kissa.example.com"
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-email">送信者メールアドレス</Label>
                  <Input
                    id="from-email"
                    type="email"
                    placeholder="noreply@example.com"
                    defaultValue="noreply@kissa.example.com"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <CardTitle>セキュリティ設定</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">二要素認証を必須にする</div>
                    <div className="text-sm text-muted-foreground">
                      管理者・編集者に二要素認証を必須とします
                    </div>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">
                      強固なパスワードを必須にする
                    </div>
                    <div className="text-sm text-muted-foreground">
                      8文字以上、大小英数字記号を含む複雑なパスワードを必須とします
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">セッションタイムアウト</div>
                    <div className="text-sm text-muted-foreground">
                      非アクティブなセッションを自動でタイムアウトします
                    </div>
                  </div>
                  <Select defaultValue="24">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1時間</SelectItem>
                      <SelectItem value="8">8時間</SelectItem>
                      <SelectItem value="24">24時間</SelectItem>
                      <SelectItem value="168">7日</SelectItem>
                      <SelectItem value="never">無制限</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">ログイン試行回数制限</div>
                    <div className="text-sm text-muted-foreground">
                      連続ログイン失敗でアカウントを一時ロックします
                    </div>
                  </div>
                  <Select defaultValue="5">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3回</SelectItem>
                      <SelectItem value="5">5回</SelectItem>
                      <SelectItem value="10">10回</SelectItem>
                      <SelectItem value="unlimited">無制限</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <CardTitle>API設定</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">REST API を有効にする</div>
                    <div className="text-sm text-muted-foreground">
                      外部アプリケーションからのAPI接続を許可します
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">API レート制限</div>
                    <div className="text-sm text-muted-foreground">
                      1時間あたりのAPIリクエスト数を制限します
                    </div>
                  </div>
                  <Select defaultValue="1000">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100回/時</SelectItem>
                      <SelectItem value="1000">1,000回/時</SelectItem>
                      <SelectItem value="10000">10,000回/時</SelectItem>
                      <SelectItem value="unlimited">無制限</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>外部サービス連携</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">Google Maps 連携</div>
                      <div className="text-sm text-muted-foreground">
                        地図表示とジオコーディング機能
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google-maps-api">
                      Google Maps API キー
                    </Label>
                    <Input
                      id="google-maps-api"
                      type="password"
                      placeholder="AIza..."
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">AWS S3 ストレージ</div>
                      <div className="text-sm text-muted-foreground">
                        画像・ファイルのクラウドストレージ
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aws-access-key">AWS アクセスキー</Label>
                      <Input id="aws-access-key" placeholder="AKIA..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aws-secret-key">
                        AWS シークレットキー
                      </Label>
                      <Input
                        id="aws-secret-key"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aws-bucket">S3 バケット名</Label>
                      <Input
                        id="aws-bucket"
                        placeholder="kissa-uploads"
                        defaultValue="kissa-uploads"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aws-region">AWS リージョン</Label>
                      <Select defaultValue="ap-northeast-1">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ap-northeast-1">
                            Asia Pacific (Tokyo)
                          </SelectItem>
                          <SelectItem value="us-east-1">
                            US East (N. Virginia)
                          </SelectItem>
                          <SelectItem value="us-west-2">
                            US West (Oregon)
                          </SelectItem>
                          <SelectItem value="eu-west-1">
                            Europe (Ireland)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <CardTitle>パフォーマンス設定</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">キャッシュを有効にする</div>
                    <div className="text-sm text-muted-foreground">
                      パフォーマンス向上のためのレスポンスキャッシュ
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">キャッシュ有効期間</div>
                    <div className="text-sm text-muted-foreground">
                      キャッシュデータの保持時間
                    </div>
                  </div>
                  <Select defaultValue="1h">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5m">5分</SelectItem>
                      <SelectItem value="30m">30分</SelectItem>
                      <SelectItem value="1h">1時間</SelectItem>
                      <SelectItem value="24h">24時間</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <CardTitle>データベース設定</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">自動バックアップ</div>
                    <div className="text-sm text-muted-foreground">
                      データベースの定期自動バックアップ
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">バックアップ頻度</div>
                    <div className="text-sm text-muted-foreground">
                      自動バックアップの実行間隔
                    </div>
                  </div>
                  <Select defaultValue="daily">
                    <SelectTrigger className="w-32">
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
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">バックアップ保持期間</div>
                    <div className="text-sm text-muted-foreground">
                      バックアップファイルの保持期間
                    </div>
                  </div>
                  <Select defaultValue="30d">
                    <SelectTrigger className="w-32">
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
