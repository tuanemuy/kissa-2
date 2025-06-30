import {
  Crown,
  Edit,
  Eye,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { UserLayout } from "@/components/layout";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  title: "権限管理 - 編集者 - Kissa",
  description: "編集者権限とユーザー招待を管理します",
};

interface PermissionsPageProps {
  searchParams: Promise<{
    tab?: string;
    keyword?: string;
    role?: string;
  }>;
}

export default async function PermissionsPage({
  searchParams,
}: PermissionsPageProps) {
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
  const activeTab = params.tab || "users";
  const keyword = params.keyword || "";
  const roleFilter = params.role;

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">権限管理</h1>
            <p className="text-muted-foreground">
              編集者権限とユーザー招待を管理します
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                編集者を招待
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>編集者を招待</DialogTitle>
                <DialogDescription>
                  新しい編集者を招待してチームに追加します。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="editor@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">権限レベル</Label>
                  <Select defaultValue="editor">
                    <SelectTrigger>
                      <SelectValue placeholder="権限を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">編集者</SelectItem>
                      <SelectItem value="moderator">モデレーター</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">招待メッセージ（任意）</Label>
                  <Textarea
                    id="message"
                    placeholder="Kissaチームへようこそ！一緒に素晴らしいコンテンツを作成しましょう。"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">招待を送信</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総編集者数</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 今月</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">アクティブ</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">10</div>
              <p className="text-xs text-muted-foreground">83%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">招待中</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">承認待ち</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                非アクティブ
              </CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">17%</p>
            </CardContent>
          </Card>
        </div>

        {/* Permissions Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" asChild>
              <Link href="/editor/permissions?tab=users">編集者一覧</Link>
            </TabsTrigger>
            <TabsTrigger value="invitations" asChild>
              <Link href="/editor/permissions?tab=invitations">招待状</Link>
            </TabsTrigger>
            <TabsTrigger value="roles" asChild>
              <Link href="/editor/permissions?tab=roles">権限設定</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardHeader>
                <CardTitle>編集者を検索</CardTitle>
              </CardHeader>
              <CardContent>
                <form method="GET" className="flex gap-4">
                  <input type="hidden" name="tab" value="users" />
                  <div className="flex-1">
                    <Input
                      name="keyword"
                      placeholder="名前やメールアドレスで検索..."
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

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>編集者一覧</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ユーザー</TableHead>
                      <TableHead>権限</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>最終アクセス</TableHead>
                      <TableHead>参加日</TableHead>
                      <TableHead>アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <UserRow
                      user={{
                        id: "1",
                        name: "田中太郎",
                        email: "tanaka@example.com",
                        avatar: "",
                        role: "admin",
                        status: "active",
                        lastAccess: "2024-12-30T10:30:00Z",
                        joinedAt: "2024-01-15T09:00:00Z",
                      }}
                    />
                    <UserRow
                      user={{
                        id: "2",
                        name: "佐藤花子",
                        email: "sato@example.com",
                        avatar: "",
                        role: "editor",
                        status: "active",
                        lastAccess: "2024-12-30T08:15:00Z",
                        joinedAt: "2024-03-22T14:30:00Z",
                      }}
                    />
                    <UserRow
                      user={{
                        id: "3",
                        name: "鈴木一郎",
                        email: "suzuki@example.com",
                        avatar: "",
                        role: "moderator",
                        status: "inactive",
                        lastAccess: "2024-12-25T16:45:00Z",
                        joinedAt: "2024-06-10T11:20:00Z",
                      }}
                    />
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>送信済み招待状</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <InvitationCard
                    invitation={{
                      id: "1",
                      email: "yamada@example.com",
                      role: "editor",
                      status: "pending",
                      sentAt: "2024-12-28T14:30:00Z",
                      expiresAt: "2025-01-11T14:30:00Z",
                    }}
                  />
                  <InvitationCard
                    invitation={{
                      id: "2",
                      email: "watanabe@example.com",
                      role: "moderator",
                      status: "accepted",
                      sentAt: "2024-12-20T09:15:00Z",
                      acceptedAt: "2024-12-21T10:30:00Z",
                    }}
                  />
                  <InvitationCard
                    invitation={{
                      id: "3",
                      email: "invalid@example.com",
                      role: "editor",
                      status: "expired",
                      sentAt: "2024-12-01T16:45:00Z",
                      expiresAt: "2024-12-15T16:45:00Z",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>権限レベルの設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RolePermissionCard
                  role={{
                    name: "管理者",
                    description: "全ての機能にアクセス可能",
                    permissions: [
                      "地域・場所の作成・編集・削除",
                      "ユーザー管理",
                      "編集者の招待・管理",
                      "システム設定の変更",
                      "分析データの閲覧",
                    ],
                    users: 2,
                    color: "bg-red-100 text-red-800",
                    icon: Crown,
                  }}
                />
                <RolePermissionCard
                  role={{
                    name: "編集者",
                    description: "コンテンツの作成・編集が可能",
                    permissions: [
                      "地域・場所の作成・編集",
                      "申請の承認・却下",
                      "分析データの閲覧",
                      "自分のコンテンツの削除",
                    ],
                    users: 8,
                    color: "bg-blue-100 text-blue-800",
                    icon: Edit,
                  }}
                />
                <RolePermissionCard
                  role={{
                    name: "モデレーター",
                    description: "コンテンツの確認・承認が可能",
                    permissions: [
                      "申請の承認・却下",
                      "地域・場所の編集",
                      "基本的な分析データの閲覧",
                    ],
                    users: 2,
                    color: "bg-green-100 text-green-800",
                    icon: ShieldCheck,
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

function UserRow({
  user,
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
  };
}) {
  return (
    <TableRow>
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
              権限を変更
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              アクセスを削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function RoleBadge({ role }: { role: string }) {
  const roleConfig = {
    admin: { label: "管理者", variant: "destructive" as const },
    editor: { label: "編集者", variant: "default" as const },
    moderator: { label: "モデレーター", variant: "secondary" as const },
  };

  const config = roleConfig[role as keyof typeof roleConfig] || {
    label: role,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    active: { label: "アクティブ", variant: "default" as const },
    inactive: { label: "非アクティブ", variant: "secondary" as const },
    suspended: { label: "停止中", variant: "destructive" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function InvitationCard({
  invitation,
}: {
  invitation: {
    id: string;
    email: string;
    role: string;
    status: string;
    sentAt: string;
    expiresAt?: string;
    acceptedAt?: string;
  };
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "border-orange-200 bg-orange-50";
      case "accepted":
        return "border-green-200 bg-green-50";
      case "expired":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <Card className={getStatusColor(invitation.status)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">{invitation.email}</div>
              <div className="text-sm text-muted-foreground">
                <RoleBadge role={invitation.role} />
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {invitation.status === "pending" && "承認待ち"}
              {invitation.status === "accepted" && "承認済み"}
              {invitation.status === "expired" && "期限切れ"}
            </div>
            <div className="text-xs text-muted-foreground">
              送信: {new Date(invitation.sentAt).toLocaleDateString("ja-JP")}
            </div>
            {invitation.expiresAt && invitation.status === "pending" && (
              <div className="text-xs text-muted-foreground">
                期限:{" "}
                {new Date(invitation.expiresAt).toLocaleDateString("ja-JP")}
              </div>
            )}
            {invitation.acceptedAt && (
              <div className="text-xs text-muted-foreground">
                承認:{" "}
                {new Date(invitation.acceptedAt).toLocaleDateString("ja-JP")}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {invitation.status === "pending" && (
              <Button size="sm" variant="outline">
                再送信
              </Button>
            )}
            <Button size="sm" variant="destructive" className="text-xs">
              削除
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RolePermissionCard({
  role,
}: {
  role: {
    name: string;
    description: string;
    permissions: string[];
    users: number;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  };
}) {
  const Icon = role.icon;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${role.color}`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{role.name}</h3>
              <p className="text-muted-foreground">{role.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{role.users} ユーザー</div>
            <Button size="sm" variant="outline" className="mt-2">
              設定を編集
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">権限</h4>
          <ul className="space-y-1">
            {role.permissions.map((permission) => (
              <li
                key={permission}
                className="flex items-center space-x-2 text-sm"
              >
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>{permission}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
