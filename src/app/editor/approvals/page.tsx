import {
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  User,
  XCircle,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { UserLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "承認待ち - 編集者 - Kissa",
  description: "ユーザーからの申請を確認し、承認または却下を行います",
};

interface ApprovalPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function ApprovalsPage({
  searchParams,
}: ApprovalPageProps) {
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
  const activeTab = params.tab || "pending";

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">承認待ち</h1>
            <p className="text-muted-foreground">
              ユーザーからの申請を確認し、承認または却下を行います
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">新規申請</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月承認</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">+12 先月比</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月却下</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">13% 却下率</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                平均処理時間
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4h</div>
              <p className="text-xs text-muted-foreground">-0.8h 先月比</p>
            </CardContent>
          </Card>
        </div>

        {/* Approval Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" asChild>
              <Link href="/editor/approvals?tab=pending">承認待ち</Link>
            </TabsTrigger>
            <TabsTrigger value="approved" asChild>
              <Link href="/editor/approvals?tab=approved">承認済み</Link>
            </TabsTrigger>
            <TabsTrigger value="rejected" asChild>
              <Link href="/editor/approvals?tab=rejected">却下済み</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>承認待ち申請</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PendingApprovalCard
                  title="品川区大井町 - カフェ・ド・クリエ"
                  description="東京都品川区大井町にある人気のカフェチェーン店。Wi-Fi完備で作業にも最適。"
                  submittedBy={{
                    name: "田中太郎",
                    avatar: "",
                    submittedAt: "2024-12-30T15:30:00Z",
                  }}
                  category="cafe"
                  region="品川区"
                />
                <PendingApprovalCard
                  title="目黒区自由が丘 - レストラン花音"
                  description="自由が丘駅から徒歩3分の和食レストラン。落ち着いた雰囲気で会食にも人気。"
                  submittedBy={{
                    name: "佐藤花子",
                    avatar: "",
                    submittedAt: "2024-12-30T12:15:00Z",
                  }}
                  category="restaurant"
                  region="目黒区"
                />
                <PendingApprovalCard
                  title="湘南エリア"
                  description="神奈川県の湘南地域。海岸線沿いの観光スポットや飲食店が多数。"
                  submittedBy={{
                    name: "鈴木一郎",
                    avatar: "",
                    submittedAt: "2024-12-30T09:45:00Z",
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>承認済み申請</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ApprovedApprovalCard
                  title="渋谷区 - スターバックスコーヒー渋谷店"
                  submittedBy={{
                    name: "山田次郎",
                    avatar: "",
                    submittedAt: "2024-12-29T16:20:00Z",
                  }}
                  approvedBy={{
                    name: "管理者",
                    approvedAt: "2024-12-29T18:45:00Z",
                  }}
                  category="cafe"
                  region="渋谷区"
                />
                <ApprovedApprovalCard
                  title="横浜中華街エリア"
                  submittedBy={{
                    name: "中村美咲",
                    avatar: "",
                    submittedAt: "2024-12-29T14:10:00Z",
                  }}
                  approvedBy={{
                    name: "管理者",
                    approvedAt: "2024-12-29T16:30:00Z",
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>却下済み申請</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RejectedApprovalCard
                  title="無効な場所申請"
                  submittedBy={{
                    name: "不明ユーザー",
                    avatar: "",
                    submittedAt: "2024-12-28T20:30:00Z",
                  }}
                  rejectedBy={{
                    name: "管理者",
                    rejectedAt: "2024-12-28T21:15:00Z",
                    reason:
                      "情報が不正確で、存在しない住所が記載されています。",
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}

function PendingApprovalCard({
  title,
  description,
  submittedBy,
  category,
  region,
}: {
  title: string;
  description?: string;
  submittedBy: {
    name: string;
    avatar: string;
    submittedAt: string;
  };
  category?: string;
  region?: string;
}) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              {category ? (
                <MapPin className="h-6 w-6 text-orange-600" />
              ) : (
                <FileText className="h-6 w-6 text-orange-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{title}</h3>
                <Badge variant="outline" className="text-orange-600">
                  {category ? "場所" : "地域"}
                </Badge>
                {category && (
                  <Badge variant="secondary">
                    {getCategoryLabel(category)}
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-muted-foreground mb-3">{description}</p>
              )}
              {region && (
                <div className="text-sm text-muted-foreground mb-3">
                  地域: {region}
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{submittedBy.name}</span>
                <span>•</span>
                <span>
                  {new Date(submittedBy.submittedAt).toLocaleString("ja-JP")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              詳細
            </Button>
            <Button size="sm" variant="destructive">
              却下
            </Button>
            <Button size="sm">承認</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApprovedApprovalCard({
  title,
  submittedBy,
  approvedBy,
  category,
  region,
}: {
  title: string;
  submittedBy: {
    name: string;
    avatar: string;
    submittedAt: string;
  };
  approvedBy: {
    name: string;
    approvedAt: string;
  };
  category?: string;
  region?: string;
}) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{title}</h3>
                <Badge variant="outline" className="text-green-600">
                  承認済み
                </Badge>
                {category && (
                  <Badge variant="secondary">
                    {getCategoryLabel(category)}
                  </Badge>
                )}
              </div>
              {region && (
                <div className="text-sm text-muted-foreground mb-3">
                  地域: {region}
                </div>
              )}
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center space-x-2">
                  <span>申請者: {submittedBy.name}</span>
                  <span>•</span>
                  <span>
                    {new Date(submittedBy.submittedAt).toLocaleString("ja-JP")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>承認者: {approvedBy.name}</span>
                  <span>•</span>
                  <span>
                    {new Date(approvedBy.approvedAt).toLocaleString("ja-JP")}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline">
            詳細
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RejectedApprovalCard({
  title,
  submittedBy,
  rejectedBy,
}: {
  title: string;
  submittedBy: {
    name: string;
    avatar: string;
    submittedAt: string;
  };
  rejectedBy: {
    name: string;
    rejectedAt: string;
    reason: string;
  };
}) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{title}</h3>
                <Badge variant="outline" className="text-red-600">
                  却下済み
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 mb-3">
                <div className="flex items-center space-x-2">
                  <span>申請者: {submittedBy.name}</span>
                  <span>•</span>
                  <span>
                    {new Date(submittedBy.submittedAt).toLocaleString("ja-JP")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>却下者: {rejectedBy.name}</span>
                  <span>•</span>
                  <span>
                    {new Date(rejectedBy.rejectedAt).toLocaleString("ja-JP")}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>却下理由:</strong> {rejectedBy.reason}
                </p>
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline">
            詳細
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getCategoryLabel(category: string): string {
  const categoryLabels: Record<string, string> = {
    restaurant: "レストラン",
    cafe: "カフェ",
    hotel: "ホテル",
    shopping: "ショッピング",
    entertainment: "エンターテイメント",
    culture: "文化",
    nature: "自然",
    historical: "歴史",
    religious: "宗教",
    transportation: "交通",
    hospital: "病院",
    education: "教育",
    office: "オフィス",
    other: "その他",
  };

  return categoryLabels[category] || category;
}
