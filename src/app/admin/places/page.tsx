import {
  Archive,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Star,
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
  title: "場所管理 - 管理者 - Kissa",
  description: "システム内の場所を管理し、承認・監視を行います",
};

interface PlacesPageProps {
  searchParams: Promise<{
    tab?: string;
    status?: string;
    category?: string;
    keyword?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function PlacesPage({ searchParams }: PlacesPageProps) {
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
  const category = params.category;
  const keyword = params.keyword || "";
  const sort = params.sort || "created_desc";

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">場所管理</h1>
            <p className="text-muted-foreground">
              システム内の場所を管理し、承認・監視を行います
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
              <Link href="/editor/places/new">
                <Plus className="h-4 w-4 mr-2" />
                新規場所作成
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
              <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">要確認</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月承認</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">456</div>
              <p className="text-xs text-muted-foreground">+18% 先月比</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">高評価場所</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,134</div>
              <p className="text-xs text-muted-foreground">4.5★以上</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">編集者数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">場所編集者</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>場所を検索・絞り込み</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="flex gap-4">
              <input type="hidden" name="tab" value={activeTab} />
              <div className="flex-1">
                <Input
                  name="keyword"
                  placeholder="場所名、説明、住所、編集者で検索..."
                  defaultValue={keyword}
                  className="w-full"
                />
              </div>
              <div className="w-40">
                <Select name="status" defaultValue={status || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータス" />
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
              <div className="w-40">
                <Select name="category" defaultValue={category || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全てのカテゴリ</SelectItem>
                    <SelectItem value="restaurant">レストラン</SelectItem>
                    <SelectItem value="cafe">カフェ</SelectItem>
                    <SelectItem value="hotel">ホテル</SelectItem>
                    <SelectItem value="shopping">ショッピング</SelectItem>
                    <SelectItem value="entertainment">
                      エンターテイメント
                    </SelectItem>
                    <SelectItem value="culture">文化</SelectItem>
                    <SelectItem value="nature">自然</SelectItem>
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
                    <SelectItem value="checkins_desc">
                      チェックイン数（多い順）
                    </SelectItem>
                    <SelectItem value="rating_desc">評価（高い順）</SelectItem>
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

        {/* Places Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all" asChild>
              <Link href="/admin/places?tab=all">全場所</Link>
            </TabsTrigger>
            <TabsTrigger value="pending" asChild>
              <Link href="/admin/places?tab=pending">承認待ち</Link>
            </TabsTrigger>
            <TabsTrigger value="approved" asChild>
              <Link href="/admin/places?tab=approved">承認済み</Link>
            </TabsTrigger>
            <TabsTrigger value="popular" asChild>
              <Link href="/admin/places?tab=popular">人気場所</Link>
            </TabsTrigger>
            <TabsTrigger value="reported" asChild>
              <Link href="/admin/places?tab=reported">報告済み</Link>
            </TabsTrigger>
            <TabsTrigger value="archived" asChild>
              <Link href="/admin/places?tab=archived">アーカイブ</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <PlacesTable
              title="全場所"
              places={getAllPlaces()}
              showApprovalActions={true}
            />
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <PlacesTable
              title="承認待ち場所"
              places={getPendingPlaces()}
              showApprovalActions={true}
              priority="high"
            />
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
            <PlacesTable
              title="承認済み場所"
              places={getApprovedPlaces()}
              showApprovalActions={false}
            />
          </TabsContent>

          <TabsContent value="popular" className="space-y-6">
            <PlacesTable
              title="人気場所"
              places={getPopularPlaces()}
              showApprovalActions={false}
              showStats={true}
            />
          </TabsContent>

          <TabsContent value="reported" className="space-y-6">
            <PlacesTable
              title="報告済み場所"
              places={getReportedPlaces()}
              showApprovalActions={true}
              showReportInfo={true}
            />
          </TabsContent>

          <TabsContent value="archived" className="space-y-6">
            <PlacesTable
              title="アーカイブ済み場所"
              places={getArchivedPlaces()}
              showApprovalActions={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function PlacesTable({
  title,
  places,
  showApprovalActions = false,
  showStats = false,
  showReportInfo = false,
  priority,
}: {
  title: string;
  places: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    status: string;
    address: string;
    createdBy: {
      name: string;
      avatar: string;
      email: string;
    };
    createdAt: string;
    checkinsCount: number;
    favoritesCount: number;
    rating: number;
    reviewsCount: number;
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
              <TableHead>場所</TableHead>
              <TableHead>カテゴリ</TableHead>
              <TableHead>作成者</TableHead>
              <TableHead>ステータス</TableHead>
              {showStats && <TableHead>統計</TableHead>}
              {showReportInfo && <TableHead>報告</TableHead>}
              <TableHead>作成日</TableHead>
              <TableHead>アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {places.map((place) => (
              <PlaceRow
                key={place.id}
                place={place}
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

function PlaceRow({
  place,
  showCheckbox,
  showStats,
  showReportInfo,
}: {
  place: {
    id: string;
    name: string;
    description: string;
    category: string;
    status: string;
    address: string;
    createdBy: {
      name: string;
      avatar: string;
      email: string;
    };
    createdAt: string;
    checkinsCount: number;
    favoritesCount: number;
    rating: number;
    reviewsCount: number;
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
          <div className="font-medium">{place.name}</div>
          <div className="text-sm text-muted-foreground line-clamp-1">
            {place.description}
          </div>
          <div className="text-xs text-muted-foreground">
            📍 {place.address}
          </div>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>{place.checkinsCount} チェックイン</span>
            <span>{place.favoritesCount} お気に入り</span>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>
                {place.rating} ({place.reviewsCount})
              </span>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <CategoryBadge category={place.category} />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={place.createdBy.avatar} />
            <AvatarFallback>{place.createdBy.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{place.createdBy.name}</div>
            <div className="text-xs text-muted-foreground">
              {place.createdBy.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={place.status} />
      </TableCell>
      {showStats && (
        <TableCell>
          <div className="space-y-1">
            <div className="text-sm font-medium">
              チェックイン: {place.checkinsCount}
            </div>
            <div className="text-xs text-muted-foreground">
              お気に入り: {place.favoritesCount}
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>
                {place.rating} ({place.reviewsCount})
              </span>
            </div>
          </div>
        </TableCell>
      )}
      {showReportInfo && (
        <TableCell>
          {place.reportCount && place.reportCount > 0 ? (
            <div className="space-y-1">
              <Badge variant="destructive" className="text-xs">
                {place.reportCount}件の報告
              </Badge>
              {place.reportReason && (
                <div className="text-xs text-muted-foreground">
                  {place.reportReason}
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
          {new Date(place.createdAt).toLocaleDateString("ja-JP")}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(place.createdAt).toLocaleTimeString("ja-JP", {
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
              <Link href={`/places/${place.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                詳細を表示
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/editor/places/${place.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {place.status === "pending" && (
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

function CategoryBadge({ category }: { category: string }) {
  const categoryConfig = {
    restaurant: { label: "レストラン", variant: "default" as const },
    cafe: { label: "カフェ", variant: "secondary" as const },
    hotel: { label: "ホテル", variant: "outline" as const },
    shopping: { label: "ショッピング", variant: "default" as const },
    entertainment: { label: "エンタメ", variant: "secondary" as const },
    culture: { label: "文化", variant: "outline" as const },
    nature: { label: "自然", variant: "default" as const },
    historical: { label: "歴史", variant: "outline" as const },
    transportation: { label: "交通", variant: "secondary" as const },
  };

  const config = categoryConfig[category as keyof typeof categoryConfig] || {
    label: category,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
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
function getAllPlaces() {
  return [
    {
      id: "1",
      name: "スターバックス渋谷店",
      description:
        "渋谷駅前の便利なスターバックス。Wi-Fi完備で作業環境も整っています。",
      category: "cafe",
      status: "approved",
      address: "東京都渋谷区渋谷1-1-1",
      createdBy: {
        name: "田中太郎",
        avatar: "",
        email: "tanaka@example.com",
      },
      createdAt: "2024-12-25T10:30:00Z",
      checkinsCount: 1345,
      favoritesCount: 234,
      rating: 4.2,
      reviewsCount: 89,
    },
    {
      id: "2",
      name: "湘南ビーチカフェ",
      description: "海を眺めながらコーヒーを楽しめる絶景カフェ。夕日が美しい。",
      category: "cafe",
      status: "pending",
      address: "神奈川県藤沢市片瀬海岸2-18-21",
      createdBy: {
        name: "佐藤花子",
        avatar: "",
        email: "sato@example.com",
      },
      createdAt: "2024-12-30T09:15:00Z",
      checkinsCount: 67,
      favoritesCount: 23,
      rating: 4.7,
      reviewsCount: 12,
    },
    {
      id: "3",
      name: "京都祇園茶屋",
      description: "伝統的な日本茶と和菓子を味わえる老舗茶屋。風情ある佇まい。",
      category: "restaurant",
      status: "approved",
      address: "京都府京都市東山区祇園町南側570-120",
      createdBy: {
        name: "鈴木一郎",
        avatar: "",
        email: "suzuki@example.com",
      },
      createdAt: "2024-12-20T14:20:00Z",
      checkinsCount: 456,
      favoritesCount: 78,
      rating: 4.5,
      reviewsCount: 34,
    },
  ];
}

function getPendingPlaces() {
  return getAllPlaces().filter((place) => place.status === "pending");
}

function getApprovedPlaces() {
  return getAllPlaces().filter((place) => place.status === "approved");
}

function getPopularPlaces() {
  return getAllPlaces()
    .filter((place) => place.status === "approved")
    .sort((a, b) => b.checkinsCount - a.checkinsCount);
}

function getReportedPlaces() {
  return [
    {
      id: "4",
      name: "問題のある店舗",
      description: "不適切な内容や虚偽の情報が含まれている可能性",
      category: "restaurant",
      status: "reported",
      address: "東京都新宿区歌舞伎町1-1-1",
      createdBy: {
        name: "不明ユーザー",
        avatar: "",
        email: "unknown@example.com",
      },
      createdAt: "2024-12-28T16:45:00Z",
      checkinsCount: 12,
      favoritesCount: 2,
      rating: 2.1,
      reviewsCount: 8,
      reportCount: 7,
      reportReason: "虚偽の情報・不適切なコンテンツ",
    },
  ];
}

function getArchivedPlaces() {
  return [
    {
      id: "5",
      name: "閉店したレストラン",
      description: "営業を終了した店舗",
      category: "restaurant",
      status: "archived",
      address: "東京都渋谷区神南1-15-3",
      createdBy: {
        name: "山田美咲",
        avatar: "",
        email: "yamada@example.com",
      },
      createdAt: "2024-12-15T11:30:00Z",
      checkinsCount: 234,
      favoritesCount: 45,
      rating: 4.0,
      reviewsCount: 23,
    },
  ];
}
