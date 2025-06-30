import {
  Archive,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Globe,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  TrendingUp,
  Users,
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
  title: "地域管理 - 管理者 - Kissa",
  description: "システム内の地域を管理し、承認・監視を行います",
};

interface RegionsPageProps {
  searchParams: Promise<{
    tab?: string;
    status?: string;
    keyword?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function RegionsPage({ searchParams }: RegionsPageProps) {
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
  const activeTab = params.tab || "all";
  const status = params.status;
  const keyword = params.keyword || "";
  const sort = params.sort || "created_desc";

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">地域管理</h1>
            <p className="text-muted-foreground">
              システム内の地域を管理し、承認・監視を行います
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
            <Button asChild>
              <Link href="/editor/regions/new">
                <Plus className="h-4 w-4 mr-2" />
                新規地域作成
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総地域数</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">要確認</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月承認</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">+12% 先月比</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">人気地域</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">845</div>
              <p className="text-xs text-muted-foreground">アクティブ地域</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">編集者数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">地域編集者</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>地域を検索・絞り込み</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="flex gap-4">
              <input type="hidden" name="tab" value={activeTab} />
              <div className="flex-1">
                <Input
                  name="keyword"
                  placeholder="地域名、説明、編集者で検索..."
                  defaultValue={keyword}
                  className="w-full"
                />
              </div>
              <div className="w-48">
                <Select name="status" defaultValue={status || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスで絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全てのステータス</SelectItem>
                    <SelectItem value="pending">承認待ち</SelectItem>
                    <SelectItem value="approved">承認済み</SelectItem>
                    <SelectItem value="rejected">却下</SelectItem>
                    <SelectItem value="archived">アーカイブ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select name="sort" defaultValue={sort}>
                  <SelectTrigger>
                    <SelectValue placeholder="並び順" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_desc">
                      作成日（新しい順）
                    </SelectItem>
                    <SelectItem value="created_asc">
                      作成日（古い順）
                    </SelectItem>
                    <SelectItem value="name_asc">名前（昇順）</SelectItem>
                    <SelectItem value="name_desc">名前（降順）</SelectItem>
                    <SelectItem value="places_desc">
                      場所数（多い順）
                    </SelectItem>
                    <SelectItem value="checkins_desc">
                      チェックイン数（多い順）
                    </SelectItem>
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

        {/* Regions Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all" asChild>
              <Link href="/admin/regions?tab=all">全地域</Link>
            </TabsTrigger>
            <TabsTrigger value="pending" asChild>
              <Link href="/admin/regions?tab=pending">承認待ち</Link>
            </TabsTrigger>
            <TabsTrigger value="approved" asChild>
              <Link href="/admin/regions?tab=approved">承認済み</Link>
            </TabsTrigger>
            <TabsTrigger value="popular" asChild>
              <Link href="/admin/regions?tab=popular">人気地域</Link>
            </TabsTrigger>
            <TabsTrigger value="reported" asChild>
              <Link href="/admin/regions?tab=reported">報告済み</Link>
            </TabsTrigger>
            <TabsTrigger value="archived" asChild>
              <Link href="/admin/regions?tab=archived">アーカイブ</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <RegionsTable
              title="全地域"
              regions={getAllRegions()}
              showApprovalActions={true}
            />
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <RegionsTable
              title="承認待ち地域"
              regions={getPendingRegions()}
              showApprovalActions={true}
              priority="high"
            />
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
            <RegionsTable
              title="承認済み地域"
              regions={getApprovedRegions()}
              showApprovalActions={false}
            />
          </TabsContent>

          <TabsContent value="popular" className="space-y-6">
            <RegionsTable
              title="人気地域"
              regions={getPopularRegions()}
              showApprovalActions={false}
              showStats={true}
            />
          </TabsContent>

          <TabsContent value="reported" className="space-y-6">
            <RegionsTable
              title="報告済み地域"
              regions={getReportedRegions()}
              showApprovalActions={true}
              showReportInfo={true}
            />
          </TabsContent>

          <TabsContent value="archived" className="space-y-6">
            <RegionsTable
              title="アーカイブ済み地域"
              regions={getArchivedRegions()}
              showApprovalActions={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function RegionsTable({
  title,
  regions,
  showApprovalActions = false,
  showStats = false,
  showReportInfo = false,
  priority,
}: {
  title: string;
  regions: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    createdBy: {
      name: string;
      avatar: string;
      email: string;
    };
    createdAt: string;
    placesCount: number;
    checkinsCount: number;
    favoritesCount: number;
    reportCount?: number;
    reportReason?: string;
  }>;
  showApprovalActions?: boolean;
  showStats?: boolean;
  showReportInfo?: boolean;
  priority?: "high" | "medium" | "low";
}) {
  const priorityColor = priority === "high" ? "border-red-200 bg-red-50" : "";

  return (
    <Card className={priorityColor}>
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
              <TableHead>地域</TableHead>
              <TableHead>作成者</TableHead>
              <TableHead>ステータス</TableHead>
              {showStats && <TableHead>統計</TableHead>}
              {showReportInfo && <TableHead>報告</TableHead>}
              <TableHead>作成日</TableHead>
              <TableHead>アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.map((region) => (
              <RegionRow
                key={region.id}
                region={region}
                showCheckbox={showApprovalActions}
                showStats={showStats}
                showReportInfo={showReportInfo}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RegionRow({
  region,
  showCheckbox,
  showStats,
  showReportInfo,
}: {
  region: {
    id: string;
    name: string;
    description: string;
    status: string;
    createdBy: {
      name: string;
      avatar: string;
      email: string;
    };
    createdAt: string;
    placesCount: number;
    checkinsCount: number;
    favoritesCount: number;
    reportCount?: number;
    reportReason?: string;
  };
  showCheckbox: boolean;
  showStats: boolean;
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
          <div className="font-medium">{region.name}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {region.description}
          </div>
          <div className="text-xs text-muted-foreground">
            {region.placesCount} 場所 • {region.checkinsCount} チェックイン •{" "}
            {region.favoritesCount} お気に入り
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={region.createdBy.avatar} />
            <AvatarFallback>{region.createdBy.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{region.createdBy.name}</div>
            <div className="text-xs text-muted-foreground">
              {region.createdBy.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={region.status} />
      </TableCell>
      {showStats && (
        <TableCell>
          <div className="space-y-1">
            <div className="text-sm font-medium">
              場所: {region.placesCount}
            </div>
            <div className="text-xs text-muted-foreground">
              チェックイン: {region.checkinsCount}
            </div>
            <div className="text-xs text-muted-foreground">
              お気に入り: {region.favoritesCount}
            </div>
          </div>
        </TableCell>
      )}
      {showReportInfo && (
        <TableCell>
          {region.reportCount && region.reportCount > 0 ? (
            <div className="space-y-1">
              <Badge variant="destructive" className="text-xs">
                {region.reportCount}件の報告
              </Badge>
              {region.reportReason && (
                <div className="text-xs text-muted-foreground">
                  {region.reportReason}
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
          {new Date(region.createdAt).toLocaleDateString("ja-JP")}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(region.createdAt).toLocaleTimeString("ja-JP", {
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
            <DropdownMenuItem asChild>
              <Link href={`/regions/${region.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                詳細を表示
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/editor/regions/${region.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {region.status === "pending" && (
              <>
                <DropdownMenuItem className="text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  承認
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <XCircle className="mr-2 h-4 w-4" />
                  却下
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>
              <Archive className="mr-2 h-4 w-4" />
              アーカイブ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
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

// Mock data functions
function getAllRegions() {
  return [
    {
      id: "1",
      name: "渋谷区",
      description:
        "東京都渋谷区の中心部。ショッピング、グルメ、エンターテイメントが集まる活気ある地域。",
      status: "approved",
      createdBy: {
        name: "田中太郎",
        avatar: "",
        email: "tanaka@example.com",
      },
      createdAt: "2024-12-25T10:30:00Z",
      placesCount: 456,
      checkinsCount: 8934,
      favoritesCount: 234,
    },
    {
      id: "2",
      name: "湘南エリア",
      description:
        "神奈川県の海岸沿いの美しい観光地域。サーフィン、海水浴、リゾート感あふれるスポット。",
      status: "pending",
      createdBy: {
        name: "佐藤花子",
        avatar: "",
        email: "sato@example.com",
      },
      createdAt: "2024-12-30T09:15:00Z",
      placesCount: 123,
      checkinsCount: 567,
      favoritesCount: 89,
    },
    {
      id: "3",
      name: "京都祇園",
      description:
        "京都の伝統的な花街。歴史ある建物と日本文化を体験できる特別な地域。",
      status: "approved",
      createdBy: {
        name: "鈴木一郎",
        avatar: "",
        email: "suzuki@example.com",
      },
      createdAt: "2024-12-20T14:20:00Z",
      placesCount: 89,
      checkinsCount: 2345,
      favoritesCount: 156,
    },
  ];
}

function getPendingRegions() {
  return getAllRegions().filter((region) => region.status === "pending");
}

function getApprovedRegions() {
  return getAllRegions().filter((region) => region.status === "approved");
}

function getPopularRegions() {
  return getAllRegions()
    .filter((region) => region.status === "approved")
    .sort((a, b) => b.checkinsCount - a.checkinsCount);
}

function getReportedRegions() {
  return [
    {
      id: "4",
      name: "問題のある地域",
      description: "不適切な内容が含まれている可能性がある地域",
      status: "reported",
      createdBy: {
        name: "不明ユーザー",
        avatar: "",
        email: "unknown@example.com",
      },
      createdAt: "2024-12-28T16:45:00Z",
      placesCount: 12,
      checkinsCount: 45,
      favoritesCount: 2,
      reportCount: 5,
      reportReason: "不適切なコンテンツ",
    },
  ];
}

function getArchivedRegions() {
  return [
    {
      id: "5",
      name: "閉鎖エリア",
      description: "現在利用できない地域",
      status: "archived",
      createdBy: {
        name: "山田美咲",
        avatar: "",
        email: "yamada@example.com",
      },
      createdAt: "2024-12-15T11:30:00Z",
      placesCount: 34,
      checkinsCount: 234,
      favoritesCount: 12,
    },
  ];
}
