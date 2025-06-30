import {
  Ban,
  Crown,
  Edit,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { UserActionButtons } from "@/components/admin/UserActionButtons";
import { AdminLayout } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "ユーザー管理 - 管理者 - Kissa",
  description: "システム内のユーザーを管理し、権限を設定します",
};

interface UsersPageProps {
  searchParams: Promise<{
    tab?: string;
    keyword?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
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
  const keyword = params.keyword || "";
  const roleFilter = params.role;
  const statusFilter = params.status;
  const _page = Number.parseInt(params.page || "1", 10);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">ユーザー管理</h1>
            <p className="text-muted-foreground">
              システム内のユーザーを管理し、権限を設定します
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  一括メール送信
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>一括メール送信</DialogTitle>
                  <DialogDescription>
                    選択したユーザーに一括でメールを送信します。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subject">件名</Label>
                    <Input id="subject" placeholder="メールの件名" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="message">メッセージ</Label>
                    <Textarea
                      id="message"
                      placeholder="メールの内容を入力してください..."
                      rows={5}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">メールを送信</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新規ユーザー作成
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新規ユーザー作成</DialogTitle>
                  <DialogDescription>
                    新しいユーザーアカウントを作成します。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">ユーザー名</Label>
                    <Input id="name" placeholder="田中太郎" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">権限レベル</Label>
                    <Select defaultValue="user">
                      <SelectTrigger>
                        <SelectValue placeholder="権限を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">一般ユーザー</SelectItem>
                        <SelectItem value="editor">編集者</SelectItem>
                        <SelectItem value="moderator">モデレーター</SelectItem>
                        <SelectItem value="admin">管理者</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="temp-password">仮パスワード</Label>
                    <Input
                      id="temp-password"
                      type="password"
                      placeholder="初回ログイン用パスワード"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">ユーザーを作成</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                総ユーザー数
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,456</div>
              <p className="text-xs text-muted-foreground">+234 今月</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">アクティブ</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">11,234</div>
              <p className="text-xs text-muted-foreground">90.2%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">編集者</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">0.7%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">停止中</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">0.4%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月新規</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">567</div>
              <p className="text-xs text-muted-foreground">+23% 先月比</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>ユーザーを検索・絞り込み</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="flex gap-4">
              <input type="hidden" name="tab" value={activeTab} />
              <div className="flex-1">
                <Input
                  name="keyword"
                  placeholder="名前、メールアドレス、IDで検索..."
                  defaultValue={keyword}
                  className="w-full"
                />
              </div>
              <div className="w-48">
                <Select name="role" defaultValue={roleFilter || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="権限で絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全ての権限</SelectItem>
                    <SelectItem value="admin">管理者</SelectItem>
                    <SelectItem value="editor">編集者</SelectItem>
                    <SelectItem value="moderator">モデレーター</SelectItem>
                    <SelectItem value="user">一般ユーザー</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select name="status" defaultValue={statusFilter || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスで絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全てのステータス</SelectItem>
                    <SelectItem value="active">アクティブ</SelectItem>
                    <SelectItem value="inactive">非アクティブ</SelectItem>
                    <SelectItem value="suspended">停止中</SelectItem>
                    <SelectItem value="banned">禁止</SelectItem>
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

        {/* Users Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" asChild>
              <Link href="/admin/users?tab=all">全ユーザー</Link>
            </TabsTrigger>
            <TabsTrigger value="active" asChild>
              <Link href="/admin/users?tab=active">アクティブ</Link>
            </TabsTrigger>
            <TabsTrigger value="editors" asChild>
              <Link href="/admin/users?tab=editors">編集者</Link>
            </TabsTrigger>
            <TabsTrigger value="suspended" asChild>
              <Link href="/admin/users?tab=suspended">停止中</Link>
            </TabsTrigger>
            <TabsTrigger value="recent" asChild>
              <Link href="/admin/users?tab=recent">新規登録</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <UsersTable
              title="全ユーザー"
              users={getAllUsers()}
              showBulkActions={true}
            />
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <UsersTable
              title="アクティブユーザー"
              users={getActiveUsers()}
              showBulkActions={true}
            />
          </TabsContent>

          <TabsContent value="editors" className="space-y-6">
            <UsersTable
              title="編集者・管理者"
              users={getEditorUsers()}
              showBulkActions={false}
            />
          </TabsContent>

          <TabsContent value="suspended" className="space-y-6">
            <UsersTable
              title="停止中のユーザー"
              users={getSuspendedUsers()}
              showBulkActions={true}
            />
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <UsersTable
              title="新規登録ユーザー（30日以内）"
              users={getRecentUsers()}
              showBulkActions={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function UsersTable({
  title,
  users,
  showBulkActions,
}: {
  title: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
    status: string;
    lastAccess: string;
    joinedAt: string;
    checkinCount: number;
    regionCount: number;
  }>;
  showBulkActions: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {showBulkActions && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <UserMinus className="h-4 w-4 mr-2" />
                一括停止
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                一括メール
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {showBulkActions && <TableHead className="w-12">選択</TableHead>}
              <TableHead>ユーザー</TableHead>
              <TableHead>権限</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>活動</TableHead>
              <TableHead>最終アクセス</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead>アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                showCheckbox={showBulkActions}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function UserRow({
  user,
  showCheckbox,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
    status: string;
    lastAccess: string;
    joinedAt: string;
    checkinCount: number;
    regionCount: number;
  };
  showCheckbox: boolean;
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
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <RoleBadge role={user.role} />
      </TableCell>
      <TableCell>
        <StatusBadge status={user.status} />
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{user.checkinCount} チェックイン</div>
          <div className="text-muted-foreground">
            {user.regionCount} 地域作成
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {new Date(user.lastAccess).toLocaleDateString("ja-JP")}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(user.lastAccess).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </TableCell>
      <TableCell>
        {new Date(user.joinedAt).toLocaleDateString("ja-JP")}
      </TableCell>
      <TableCell>
        <UserActionButtons user={user} />
      </TableCell>
    </TableRow>
  );
}

function RoleBadge({ role }: { role: string }) {
  const roleConfig = {
    admin: { label: "管理者", variant: "destructive" as const, icon: Crown },
    editor: { label: "編集者", variant: "default" as const, icon: Edit },
    moderator: {
      label: "モデレーター",
      variant: "secondary" as const,
      icon: ShieldCheck,
    },
    user: { label: "一般ユーザー", variant: "outline" as const, icon: User },
  };

  const config = roleConfig[role as keyof typeof roleConfig] || {
    label: role,
    variant: "secondary" as const,
    icon: User,
  };

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <config.icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    active: { label: "アクティブ", variant: "default" as const },
    inactive: { label: "非アクティブ", variant: "secondary" as const },
    suspended: { label: "停止中", variant: "destructive" as const },
    banned: { label: "禁止", variant: "destructive" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Mock data functions
function getAllUsers() {
  return [
    {
      id: "1",
      name: "田中太郎",
      email: "tanaka@example.com",
      avatar: "",
      role: "admin",
      status: "active",
      lastAccess: "2024-12-30T10:30:00Z",
      joinedAt: "2024-01-15T09:00:00Z",
      checkinCount: 234,
      regionCount: 5,
    },
    {
      id: "2",
      name: "佐藤花子",
      email: "sato@example.com",
      avatar: "",
      role: "editor",
      status: "active",
      lastAccess: "2024-12-30T08:15:00Z",
      joinedAt: "2024-03-22T14:30:00Z",
      checkinCount: 89,
      regionCount: 12,
    },
    {
      id: "3",
      name: "鈴木一郎",
      email: "suzuki@example.com",
      avatar: "",
      role: "user",
      status: "inactive",
      lastAccess: "2024-12-25T16:45:00Z",
      joinedAt: "2024-06-10T11:20:00Z",
      checkinCount: 156,
      regionCount: 0,
    },
    {
      id: "4",
      name: "山田美咲",
      email: "yamada@example.com",
      avatar: "",
      role: "user",
      status: "suspended",
      lastAccess: "2024-12-20T12:00:00Z",
      joinedAt: "2024-08-05T15:45:00Z",
      checkinCount: 45,
      regionCount: 0,
    },
  ];
}

function getActiveUsers() {
  return getAllUsers().filter((user) => user.status === "active");
}

function getEditorUsers() {
  return getAllUsers().filter((user) =>
    ["admin", "editor", "moderator"].includes(user.role),
  );
}

function getSuspendedUsers() {
  return getAllUsers().filter((user) =>
    ["suspended", "banned"].includes(user.status),
  );
}

function getRecentUsers() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return getAllUsers().filter(
    (user) => new Date(user.joinedAt) > thirtyDaysAgo,
  );
}
