import {
  Archive,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  MapPin,
  MoreHorizontal,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { AdminLayout } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "コンテンツ管理 - 管理者 - Kissa",
  description: "地域・場所・チェックインなどのコンテンツを管理します",
};

interface ContentPageProps {
  searchParams: Promise<{
    tab?: string;
    keyword?: string;
    status?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function ContentPage({ searchParams }: ContentPageProps) {
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
  const activeTab = params.tab || "pending";
  const keyword = params.keyword || "";
  const statusFilter = params.status;
  const categoryFilter = params.category;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">コンテンツ管理</h1>
            <p className="text-muted-foreground">
              地域・場所・チェックインなどのコンテンツを管理します
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Archive className="h-4 w-4 mr-2" />
              一括アーカイブ
            </Button>
            <Button variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              一括承認
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">要確認</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月承認</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234</div>
              <p className="text-xs text-muted-foreground">+18% 先月比</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月却下</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">9% 却下率</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">報告済み</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">要対応</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">アーカイブ</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">非公開</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>コンテンツを検索・絞り込み</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="flex gap-4">
              <input type="hidden" name="tab" value={activeTab} />
              <div className="flex-1">
                <Input
                  name="keyword"
                  placeholder="コンテンツ名、作成者、説明で検索..."
                  defaultValue={keyword}
                  className="w-full"
                />
              </div>
              <div className="w-48">
                <Select name="status" defaultValue={statusFilter || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスで絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全てのステータス</SelectItem>
                    <SelectItem value="pending">承認待ち</SelectItem>
                    <SelectItem value="approved">承認済み</SelectItem>
                    <SelectItem value="rejected">却下</SelectItem>
                    <SelectItem value="reported">報告済み</SelectItem>
                    <SelectItem value="archived">アーカイブ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select name="category" defaultValue={categoryFilter || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリーで絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全てのカテゴリー</SelectItem>
                    <SelectItem value="region">地域</SelectItem>
                    <SelectItem value="place">場所</SelectItem>
                    <SelectItem value="checkin">チェックイン</SelectItem>
                    <SelectItem value="review">レビュー</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                検索
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending" asChild>
              <Link href="/admin/content?tab=pending">承認待ち</Link>
            </TabsTrigger>
            <TabsTrigger value="approved" asChild>
              <Link href="/admin/content?tab=approved">承認済み</Link>
            </TabsTrigger>
            <TabsTrigger value="reported" asChild>
              <Link href="/admin/content?tab=reported">報告済み</Link>
            </TabsTrigger>
            <TabsTrigger value="rejected" asChild>
              <Link href="/admin/content?tab=rejected">却下済み</Link>
            </TabsTrigger>
            <TabsTrigger value="archived" asChild>
              <Link href="/admin/content?tab=archived">アーカイブ</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <ContentTable
              title="承認待ちコンテンツ"
              items={getPendingContent()}
              showApprovalActions={true}
            />
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
            <ContentTable
              title="承認済みコンテンツ"
              items={getApprovedContent()}
              showApprovalActions={false}
            />
          </TabsContent>

          <TabsContent value="reported" className="space-y-6">
            <ContentTable
              title="報告済みコンテンツ"
              items={getReportedContent()}
              showApprovalActions={true}
              showReportInfo={true}
            />
          </TabsContent>

          <TabsContent value="rejected" className="space-y-6">
            <ContentTable
              title="却下済みコンテンツ"
              items={getRejectedContent()}
              showApprovalActions={false}
            />
          </TabsContent>

          <TabsContent value="archived" className="space-y-6">
            <ContentTable
              title="アーカイブ済みコンテンツ"
              items={getArchivedContent()}
              showApprovalActions={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function ContentTable({
  title,
  items,
  showApprovalActions,
  showReportInfo = false,
}: {
  title: string;
  items: Array<{
    id: string;
    type: "region" | "place" | "checkin" | "review";
    title: string;
    description?: string;
    author: {
      name: string;
      avatar: string;
      email: string;
    };
    status: string;
    createdAt: string;
    category?: string;
    reportCount?: number;
    reportReason?: string;
  }>;
  showApprovalActions: boolean;
  showReportInfo?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {showApprovalActions && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <XCircle className="h-4 w-4 mr-2" />
                一括却下
              </Button>
              <Button size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                一括承認
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {showApprovalActions && (
                <TableHead className="w-12">選択</TableHead>
              )}
              <TableHead>コンテンツ</TableHead>
              <TableHead>種類</TableHead>
              <TableHead>作成者</TableHead>
              <TableHead>ステータス</TableHead>
              {showReportInfo && <TableHead>報告</TableHead>}
              <TableHead>作成日</TableHead>
              <TableHead>アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <ContentRow
                key={item.id}
                item={item}
                showCheckbox={showApprovalActions}
                showReportInfo={showReportInfo}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ContentRow({
  item,
  showCheckbox,
  showReportInfo,
}: {
  item: {
    id: string;
    type: "region" | "place" | "checkin" | "review";
    title: string;
    description?: string;
    author: {
      name: string;
      avatar: string;
      email: string;
    };
    status: string;
    createdAt: string;
    category?: string;
    reportCount?: number;
    reportReason?: string;
  };
  showCheckbox: boolean;
  showReportInfo: boolean;
}) {
  return (
    <TableRow>
      {showCheckbox && (
        <TableCell>
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
        </TableCell>
      )}
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{item.title}</div>
          {item.description && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </div>
          )}
          {item.category && (
            <Badge variant="outline" className="text-xs">
              {getCategoryLabel(item.category)}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <TypeBadge type={item.type} />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={item.author.avatar} />
            <AvatarFallback>{item.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{item.author.name}</div>
            <div className="text-xs text-muted-foreground">
              {item.author.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={item.status} />
      </TableCell>
      {showReportInfo && (
        <TableCell>
          {item.reportCount && item.reportCount > 0 ? (
            <div className="space-y-1">
              <Badge variant="destructive" className="text-xs">
                {item.reportCount}件の報告
              </Badge>
              {item.reportReason && (
                <div className="text-xs text-muted-foreground">
                  {item.reportReason}
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
      )}
      <TableCell>
        <div className="text-sm">
          {new Date(item.createdAt).toLocaleDateString("ja-JP")}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(item.createdAt).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>アクション</DropdownMenuLabel>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              詳細を表示
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {item.status === "pending" && (
              <>
                <DropdownMenuItem className="text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  承認
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <XCircle className="mr-2 h-4 w-4" />
                  却下
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem>
              <Archive className="mr-2 h-4 w-4" />
              アーカイブ
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function TypeBadge({
  type,
}: {
  type: "region" | "place" | "checkin" | "review";
}) {
  const typeConfig = {
    region: { label: "地域", variant: "default" as const, icon: MapPin },
    place: { label: "場所", variant: "secondary" as const, icon: MapPin },
    checkin: {
      label: "チェックイン",
      variant: "outline" as const,
      icon: Clock,
    },
    review: { label: "レビュー", variant: "outline" as const, icon: FileText },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { label: "承認待ち", variant: "secondary" as const },
    approved: { label: "承認済み", variant: "default" as const },
    rejected: { label: "却下", variant: "destructive" as const },
    reported: { label: "報告済み", variant: "destructive" as const },
    archived: { label: "アーカイブ", variant: "outline" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
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

// Mock data functions
function getPendingContent() {
  return [
    {
      id: "1",
      type: "place" as const,
      title: "新宿駅前カフェ",
      description:
        "新宿駅から徒歩1分の便利なカフェです。Wi-Fi完備で作業環境も整っています。",
      author: {
        name: "田中太郎",
        avatar: "",
        email: "tanaka@example.com",
      },
      status: "pending",
      createdAt: "2024-12-30T10:30:00Z",
      category: "cafe",
    },
    {
      id: "2",
      type: "region" as const,
      title: "湘南エリア",
      description: "神奈川県の海岸沿いの美しい観光地域",
      author: {
        name: "佐藤花子",
        avatar: "",
        email: "sato@example.com",
      },
      status: "pending",
      createdAt: "2024-12-30T09:15:00Z",
    },
  ];
}

function getApprovedContent() {
  return [
    {
      id: "3",
      type: "place" as const,
      title: "渋谷スカイ",
      description: "渋谷の新しい展望スポット",
      author: {
        name: "鈴木一郎",
        avatar: "",
        email: "suzuki@example.com",
      },
      status: "approved",
      createdAt: "2024-12-29T16:20:00Z",
      category: "entertainment",
    },
  ];
}

function getReportedContent() {
  return [
    {
      id: "4",
      type: "checkin" as const,
      title: "不適切な投稿",
      description: "スパム的な内容が含まれています",
      author: {
        name: "不明ユーザー",
        avatar: "",
        email: "unknown@example.com",
      },
      status: "reported",
      createdAt: "2024-12-29T14:10:00Z",
      reportCount: 5,
      reportReason: "スパム・宣伝",
    },
  ];
}

function getRejectedContent() {
  return [
    {
      id: "5",
      type: "place" as const,
      title: "存在しない場所",
      description: "実在しない住所が記載されています",
      author: {
        name: "テストユーザー",
        avatar: "",
        email: "test@example.com",
      },
      status: "rejected",
      createdAt: "2024-12-28T20:30:00Z",
      category: "other",
    },
  ];
}

function getArchivedContent() {
  return [
    {
      id: "6",
      type: "place" as const,
      title: "閉店したレストラン",
      description: "既に営業を終了している店舗",
      author: {
        name: "山田美咲",
        avatar: "",
        email: "yamada@example.com",
      },
      status: "archived",
      createdAt: "2024-12-20T12:00:00Z",
      category: "restaurant",
    },
  ];
}
