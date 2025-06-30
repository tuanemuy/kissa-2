import {
  Crown,
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { UserDomain } from "@/core/domain/user/types";

export const metadata: Metadata = {
  title: "ロール管理 - ユーザー管理 - 管理者 - Kissa",
  description: "ユーザーロールと権限レベルを管理します",
};

export default async function RolesPage() {
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

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">ロール管理</h1>
            <p className="text-muted-foreground">
              ユーザーロールと権限レベルを管理します
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新規ロール作成
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規ロール作成</DialogTitle>
                <DialogDescription>
                  新しいユーザーロールを作成します。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="role-name">ロール名</Label>
                  <Input id="role-name" placeholder="例: モデレーター" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role-description">説明</Label>
                  <Textarea
                    id="role-description"
                    placeholder="このロールの説明を入力してください..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role-color">カラー</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="role-color"
                      type="color"
                      defaultValue="#6b7280"
                      className="w-16 h-10"
                    />
                    <Input defaultValue="#6b7280" className="flex-1" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">ロールを作成</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Role Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総ロール数</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">システム全体</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">管理者</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">0.1% のユーザー</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">編集者</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">0.7% のユーザー</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                一般ユーザー
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,355</div>
              <p className="text-xs text-muted-foreground">99.2% のユーザー</p>
            </CardContent>
          </Card>
        </div>

        {/* Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle>ロール一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ロール</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>ユーザー数</TableHead>
                  <TableHead>権限</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead>アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getRoles().map((role) => (
                  <RoleRow key={role.id} role={role} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Role Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>権限マトリックス</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">権限</th>
                    <th className="text-center p-2">一般ユーザー</th>
                    <th className="text-center p-2">編集者</th>
                    <th className="text-center p-2">モデレーター</th>
                    <th className="text-center p-2">管理者</th>
                  </tr>
                </thead>
                <tbody>
                  <PermissionRow
                    permission="プロフィール表示"
                    user={true}
                    editor={true}
                    moderator={true}
                    admin={true}
                  />
                  <PermissionRow
                    permission="チェックイン作成"
                    user={true}
                    editor={true}
                    moderator={true}
                    admin={true}
                  />
                  <PermissionRow
                    permission="地域・場所作成"
                    user={false}
                    editor={true}
                    moderator={true}
                    admin={true}
                  />
                  <PermissionRow
                    permission="コンテンツ承認"
                    user={false}
                    editor={false}
                    moderator={true}
                    admin={true}
                  />
                  <PermissionRow
                    permission="ユーザー管理"
                    user={false}
                    editor={false}
                    moderator={false}
                    admin={true}
                  />
                  <PermissionRow
                    permission="システム設定"
                    user={false}
                    editor={false}
                    moderator={false}
                    admin={true}
                  />
                  <PermissionRow
                    permission="データエクスポート"
                    user={false}
                    editor={false}
                    moderator={true}
                    admin={true}
                  />
                  <PermissionRow
                    permission="レポート閲覧"
                    user={false}
                    editor={true}
                    moderator={true}
                    admin={true}
                  />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function RoleRow({
  role,
}: {
  role: {
    id: string;
    name: string;
    description: string;
    userCount: number;
    permissions: string[];
    color: string;
    createdAt: string;
    isDefault: boolean;
  };
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: role.color }}
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{role.name}</span>
              {role.isDefault && (
                <Badge variant="outline" className="text-xs">
                  デフォルト
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">ID: {role.id}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-xs">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {role.description}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium">
          {role.userCount.toLocaleString()}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-xs">
          {role.permissions.slice(0, 3).map((permission) => (
            <Badge key={permission} variant="secondary" className="text-xs">
              {permission}
            </Badge>
          ))}
          {role.permissions.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{role.permissions.length - 3}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {new Date(role.createdAt).toLocaleDateString("ja-JP")}
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
              ロールを編集
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              権限を設定
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!role.isDefault && (
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                ロールを削除
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function PermissionRow({
  permission,
  user,
  editor,
  moderator,
  admin,
}: {
  permission: string;
  user: boolean;
  editor: boolean;
  moderator: boolean;
  admin: boolean;
}) {
  return (
    <tr className="border-b">
      <td className="p-2 text-sm font-medium">{permission}</td>
      <td className="p-2 text-center">
        <PermissionIndicator hasPermission={user} />
      </td>
      <td className="p-2 text-center">
        <PermissionIndicator hasPermission={editor} />
      </td>
      <td className="p-2 text-center">
        <PermissionIndicator hasPermission={moderator} />
      </td>
      <td className="p-2 text-center">
        <PermissionIndicator hasPermission={admin} />
      </td>
    </tr>
  );
}

function PermissionIndicator({ hasPermission }: { hasPermission: boolean }) {
  return (
    <div className="flex justify-center">
      {hasPermission ? (
        <ShieldCheck className="h-4 w-4 text-green-600" />
      ) : (
        <div className="h-4 w-4 rounded-full bg-gray-200" />
      )}
    </div>
  );
}

// Mock data
function getRoles() {
  return [
    {
      id: "admin",
      name: "管理者",
      description: "システム全体への完全なアクセス権限を持つロール",
      userCount: 12,
      permissions: ["全権限", "ユーザー管理", "システム設定", "データアクセス"],
      color: "#dc2626",
      createdAt: "2024-01-01T00:00:00Z",
      isDefault: true,
    },
    {
      id: "moderator",
      name: "モデレーター",
      description: "コンテンツの承認・管理権限を持つロール",
      userCount: 34,
      permissions: ["コンテンツ管理", "ユーザー停止", "レポート閲覧"],
      color: "#ea580c",
      createdAt: "2024-01-01T00:00:00Z",
      isDefault: true,
    },
    {
      id: "editor",
      name: "編集者",
      description: "地域・場所の作成・編集権限を持つロール",
      userCount: 89,
      permissions: ["コンテンツ作成", "レポート閲覧", "データエクスポート"],
      color: "#16a34a",
      createdAt: "2024-01-01T00:00:00Z",
      isDefault: true,
    },
    {
      id: "premium",
      name: "プレミアムユーザー",
      description: "サブスクリプション契約済みの有料ユーザー",
      userCount: 234,
      permissions: ["プレミアム機能", "優先サポート", "高度な分析"],
      color: "#7c3aed",
      createdAt: "2024-02-15T00:00:00Z",
      isDefault: false,
    },
    {
      id: "user",
      name: "一般ユーザー",
      description: "基本的な機能を利用できる標準ユーザー",
      userCount: 12355,
      permissions: ["基本機能", "チェックイン", "プロフィール管理"],
      color: "#6b7280",
      createdAt: "2024-01-01T00:00:00Z",
      isDefault: true,
    },
  ];
}
