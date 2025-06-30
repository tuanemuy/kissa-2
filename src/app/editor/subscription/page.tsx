import {
  Check,
  CreditCard,
  Crown,
  Download,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { UserLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "サブスクリプション管理 - 編集者 - Kissa",
  description: "サブスクリプションプランと請求情報を管理します",
};

interface SubscriptionPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function SubscriptionPage({
  searchParams,
}: SubscriptionPageProps) {
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
  const activeTab = params.tab || "current";

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">サブスクリプション管理</h1>
            <p className="text-muted-foreground">
              サブスクリプションプランと請求情報を管理します
            </p>
          </div>
        </div>

        {/* Current Plan Overview */}
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Crown className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    プロフェッショナルプラン
                  </CardTitle>
                  <p className="text-muted-foreground">
                    編集者向け高機能プラン
                  </p>
                </div>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                アクティブ
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">¥2,980</div>
                <div className="text-sm text-muted-foreground">月額</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">2025/01/30</div>
                <div className="text-sm text-muted-foreground">次回請求日</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">無制限</div>
                <div className="text-sm text-muted-foreground">
                  地域・場所作成
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">4/5</div>
                <div className="text-sm text-muted-foreground">
                  招待可能編集者数
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                今月の使用量
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">地域作成</span>
                    <span className="text-sm font-medium">12 / 無制限</span>
                  </div>
                  <Progress value={12} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">場所作成</span>
                    <span className="text-sm font-medium">89 / 無制限</span>
                  </div>
                  <Progress value={89} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">招待中編集者</span>
                    <span className="text-sm font-medium">4 / 5</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                月次レポート
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    総訪問数
                  </span>
                  <span className="font-medium">24,891</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    新規チェックイン
                  </span>
                  <span className="font-medium">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    お気に入り追加
                  </span>
                  <span className="font-medium">567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">成長率</span>
                  <span className="font-medium text-green-600">+23%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">サポート</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">優先サポート</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">詳細分析レポート</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">API アクセス</span>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-3">
                  サポートに連絡
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current" asChild>
              <Link href="/editor/subscription?tab=current">現在のプラン</Link>
            </TabsTrigger>
            <TabsTrigger value="billing" asChild>
              <Link href="/editor/subscription?tab=billing">請求履歴</Link>
            </TabsTrigger>
            <TabsTrigger value="plans" asChild>
              <Link href="/editor/subscription?tab=plans">プラン比較</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>プラン詳細</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">含まれる機能</h4>
                    <div className="space-y-2">
                      <FeatureItem
                        feature="無制限の地域・場所作成"
                        included={true}
                      />
                      <FeatureItem
                        feature="最大5名の編集者招待"
                        included={true}
                      />
                      <FeatureItem feature="詳細分析レポート" included={true} />
                      <FeatureItem feature="優先サポート" included={true} />
                      <FeatureItem feature="API アクセス" included={true} />
                      <FeatureItem
                        feature="カスタムブランディング"
                        included={true}
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">請求情報</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">プラン</span>
                        <span className="font-medium">プロフェッショナル</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">月額料金</span>
                        <span className="font-medium">¥2,980</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          次回請求日
                        </span>
                        <span className="font-medium">2025年1月30日</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          支払い方法
                        </span>
                        <span className="font-medium">•••• 1234</span>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full">
                          支払い方法を変更
                        </Button>
                        <Button variant="outline" className="w-full">
                          プランをキャンセル
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>請求履歴</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    全てダウンロード
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <BillingItem
                    date="2024-12-30"
                    amount="¥2,980"
                    status="支払い済み"
                    description="プロフェッショナルプラン - 2024年12月"
                    invoiceId="INV-2024-12-001"
                  />
                  <BillingItem
                    date="2024-11-30"
                    amount="¥2,980"
                    status="支払い済み"
                    description="プロフェッショナルプラン - 2024年11月"
                    invoiceId="INV-2024-11-001"
                  />
                  <BillingItem
                    date="2024-10-30"
                    amount="¥2,980"
                    status="支払い済み"
                    description="プロフェッショナルプラン - 2024年10月"
                    invoiceId="INV-2024-10-001"
                  />
                  <BillingItem
                    date="2024-09-30"
                    amount="¥2,980"
                    status="支払い済み"
                    description="プロフェッショナルプラン - 2024年9月"
                    invoiceId="INV-2024-09-001"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PlanCard
                plan={{
                  name: "フリー",
                  price: "¥0",
                  period: "永続無料",
                  description: "個人利用に最適",
                  features: [
                    "3地域まで作成可能",
                    "地域ごと10場所まで",
                    "基本分析",
                    "コミュニティサポート",
                  ],
                  current: false,
                  popular: false,
                }}
              />
              <PlanCard
                plan={{
                  name: "プロフェッショナル",
                  price: "¥2,980",
                  period: "月額",
                  description: "編集者・チーム利用",
                  features: [
                    "無制限の地域・場所作成",
                    "最大5名の編集者招待",
                    "詳細分析レポート",
                    "優先サポート",
                    "API アクセス",
                  ],
                  current: true,
                  popular: true,
                }}
              />
              <PlanCard
                plan={{
                  name: "エンタープライズ",
                  price: "¥9,800",
                  period: "月額",
                  description: "大規模組織向け",
                  features: [
                    "無制限の地域・場所作成",
                    "無制限の編集者招待",
                    "高度な分析・レポート",
                    "専用サポート",
                    "カスタムAPI",
                    "SSO対応",
                  ],
                  current: false,
                  popular: false,
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}

function FeatureItem({
  feature,
  included,
}: {
  feature: string;
  included: boolean;
}) {
  return (
    <div className="flex items-center space-x-2">
      {included ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <div className="h-4 w-4" />
      )}
      <span className={`text-sm ${included ? "" : "text-muted-foreground"}`}>
        {feature}
      </span>
    </div>
  );
}

function BillingItem({
  date,
  amount,
  status,
  description,
  invoiceId,
}: {
  date: string;
  amount: string;
  status: string;
  description: string;
  invoiceId: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <div className="font-medium">{description}</div>
          <div className="text-sm text-muted-foreground">
            {new Date(date).toLocaleDateString("ja-JP")} • {invoiceId}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold">{amount}</div>
        <div className="text-sm text-green-600">{status}</div>
      </div>
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        PDF
      </Button>
    </div>
  );
}

function PlanCard({
  plan,
}: {
  plan: {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    current: boolean;
    popular: boolean;
  };
}) {
  return (
    <Card className={`relative ${plan.current ? "border-primary" : ""}`}>
      {plan.popular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Badge className="bg-primary text-primary-foreground">人気</Badge>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="space-y-2">
          <div className="text-3xl font-bold">{plan.price}</div>
          <div className="text-sm text-muted-foreground">{plan.period}</div>
        </div>
        <p className="text-muted-foreground">{plan.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {plan.features.map((feature) => (
            <FeatureItem key={feature} feature={feature} included={true} />
          ))}
        </div>
        <Button
          className="w-full"
          variant={plan.current ? "secondary" : "default"}
          disabled={plan.current}
        >
          {plan.current ? "現在のプラン" : "プランを選択"}
        </Button>
      </CardContent>
    </Card>
  );
}
