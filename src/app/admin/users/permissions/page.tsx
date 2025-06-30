import {
  Database,
  Edit,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Shield,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  title: "権限管理 - ユーザー管理 - 管理者 - Kissa",
  description: "システム権限の詳細設定と管理を行います",
};

interface PermissionsPageProps {
  searchParams: Promise<{
    tab?: string;
    category?: string;
    keyword?: string;
  }>;
}

export default async function PermissionsPage({
  searchParams,
}: PermissionsPageProps) {
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
  const activeTab = params.tab || "permissions";
  const category = params.category;
  const keyword = params.keyword || "";

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">権限管理</h1>
            <p className="text-muted-foreground">
              システム権限の詳細設定と管理を行います
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  権限グループ作成
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>権限グループ作成</DialogTitle>
                  <DialogDescription>
                    関連する権限をまとめる新しいグループを作成します。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="group-name">グループ名</Label>
                    <Input id="group-name" placeholder="例: コンテンツ管理" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="group-description">説明</Label>
                    <Textarea
                      id="group-description"
                      placeholder="このグループの説明を入力してください..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">グループを作成</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新規権限作成
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新規権限作成</DialogTitle>
                  <DialogDescription>
                    新しいシステム権限を作成します。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="permission-name">権限名</Label>
                    <Input
                      id="permission-name"
                      placeholder="例: region.create"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="permission-display">表示名</Label>
                    <Input
                      id="permission-display"
                      placeholder="例: 地域の作成"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="permission-category">カテゴリ</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content">コンテンツ管理</SelectItem>
                        <SelectItem value="user">ユーザー管理</SelectItem>
                        <SelectItem value="system">システム管理</SelectItem>
                        <SelectItem value="moderation">
                          モデレーション
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="permission-description">説明</Label>
                    <Textarea
                      id="permission-description"
                      placeholder="この権限の説明を入力してください..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">権限を作成</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総権限数</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">システム全体</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                権限グループ
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">機能別グループ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                アクティブユーザー
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">135</div>
              <p className="text-xs text-muted-foreground">特別権限保有者</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                カスタム権限
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">管理者作成</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>権限を検索・絞り込み</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="flex gap-4">
              <input type="hidden" name="tab" value={activeTab} />
              <div className="flex-1">
                <Input
                  name="keyword"
                  placeholder="権限名、表示名、説明で検索..."
                  defaultValue={keyword}
                  className="w-full"
                />
              </div>
              <div className="w-48">
                <Select name="category" defaultValue={category || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリで絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全てのカテゴリ</SelectItem>
                    <SelectItem value="content">コンテンツ管理</SelectItem>
                    <SelectItem value="user">ユーザー管理</SelectItem>
                    <SelectItem value="system">システム管理</SelectItem>
                    <SelectItem value="moderation">モデレーション</SelectItem>
                    <SelectItem value="analytics">分析・レポート</SelectItem>
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

        {/* Permissions Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="permissions" asChild>
              <Link href="/admin/users/permissions?tab=permissions">
                権限一覧
              </Link>
            </TabsTrigger>
            <TabsTrigger value="groups" asChild>
              <Link href="/admin/users/permissions?tab=groups">
                権限グループ
              </Link>
            </TabsTrigger>
            <TabsTrigger value="assignments" asChild>
              <Link href="/admin/users/permissions?tab=assignments">
                権限割り当て
              </Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>権限一覧</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>権限</TableHead>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead>説明</TableHead>
                      <TableHead>割り当て済みロール</TableHead>
                      <TableHead>ユーザー数</TableHead>
                      <TableHead>アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPermissions().map((permission) => (
                      <PermissionRow
                        key={permission.id}
                        permission={permission}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getPermissionGroups().map((group) => (
                <PermissionGroupCard key={group.id} group={group} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>権限割り当てマトリックス</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {getPermissionCategories().map((category) => (
                    <div key={category.name} className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center space-x-2">
                        <category.icon className="h-5 w-5" />
                        <span>{category.displayName}</span>
                      </h3>
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
                            {category.permissions.map((permission) => (
                              <PermissionAssignmentRow
                                key={permission.name}
                                permission={permission}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
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

function PermissionRow({
  permission,
}: {
  permission: {
    id: string;
    name: string;
    displayName: string;
    category: string;
    description: string;
    assignedRoles: string[];
    userCount: number;
    isSystem: boolean;
  };
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{permission.displayName}</span>
            {permission.isSystem && (
              <Badge variant="outline" className="text-xs">
                システム
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground font-mono">
            {permission.name}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <CategoryBadge category={permission.category} />
      </TableCell>
      <TableCell>
        <div className="max-w-xs">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {permission.description}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-xs">
          {permission.assignedRoles.map((role) => (
            <Badge key={role} variant="secondary" className="text-xs">
              {role}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium">{permission.userCount}</div>
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
              権限を編集
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              割り当てを管理
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!permission.isSystem && (
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                権限を削除
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const categoryConfig = {
    content: { label: "コンテンツ", variant: "default" as const },
    user: { label: "ユーザー", variant: "secondary" as const },
    system: { label: "システム", variant: "destructive" as const },
    moderation: { label: "モデレーション", variant: "outline" as const },
    analytics: { label: "分析", variant: "outline" as const },
  };

  const config = categoryConfig[category as keyof typeof categoryConfig] || {
    label: category,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function PermissionGroupCard({
  group,
}: {
  group: {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    assignedRoles: string[];
    userCount: number;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{group.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{group.description}</p>
        <div className="space-y-2">
          <div className="text-sm font-medium">
            権限数: {group.permissions.length}
          </div>
          <div className="text-sm font-medium">
            ユーザー数: {group.userCount}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {group.assignedRoles.map((role) => (
            <Badge key={role} variant="secondary" className="text-xs">
              {role}
            </Badge>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Edit className="h-3 w-3 mr-1" />
            編集
          </Button>
          <Button variant="outline" size="sm">
            <Users className="h-3 w-3 mr-1" />
            管理
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PermissionAssignmentRow({
  permission,
}: {
  permission: {
    name: string;
    displayName: string;
    user: boolean;
    editor: boolean;
    moderator: boolean;
    admin: boolean;
  };
}) {
  return (
    <tr className="border-b">
      <td className="p-2 text-sm font-medium">{permission.displayName}</td>
      <td className="p-2 text-center">
        <Switch checked={permission.user} />
      </td>
      <td className="p-2 text-center">
        <Switch checked={permission.editor} />
      </td>
      <td className="p-2 text-center">
        <Switch checked={permission.moderator} />
      </td>
      <td className="p-2 text-center">
        <Switch checked={permission.admin} />
      </td>
    </tr>
  );
}

// Mock data functions
function getPermissions() {
  return [
    {
      id: "user.view",
      name: "user.view",
      displayName: "ユーザー閲覧",
      category: "user",
      description: "ユーザープロフィールと基本情報を閲覧できる",
      assignedRoles: ["編集者", "モデレーター", "管理者"],
      userCount: 135,
      isSystem: true,
    },
    {
      id: "user.edit",
      name: "user.edit",
      displayName: "ユーザー編集",
      category: "user",
      description: "ユーザー情報の編集と更新ができる",
      assignedRoles: ["管理者"],
      userCount: 12,
      isSystem: true,
    },
    {
      id: "content.create",
      name: "content.create",
      displayName: "コンテンツ作成",
      category: "content",
      description: "新しい地域・場所・チェックインを作成できる",
      assignedRoles: ["編集者", "モデレーター", "管理者"],
      userCount: 135,
      isSystem: true,
    },
    {
      id: "content.moderate",
      name: "content.moderate",
      displayName: "コンテンツ承認",
      category: "moderation",
      description: "コンテンツの承認・却下ができる",
      assignedRoles: ["モデレーター", "管理者"],
      userCount: 46,
      isSystem: true,
    },
    {
      id: "system.settings",
      name: "system.settings",
      displayName: "システム設定",
      category: "system",
      description: "システム全体の設定を変更できる",
      assignedRoles: ["管理者"],
      userCount: 12,
      isSystem: true,
    },
    {
      id: "analytics.view",
      name: "analytics.view",
      displayName: "分析データ閲覧",
      category: "analytics",
      description: "詳細な分析データとレポートを閲覧できる",
      assignedRoles: ["編集者", "モデレーター", "管理者"],
      userCount: 135,
      isSystem: true,
    },
  ];
}

function getPermissionGroups() {
  return [
    {
      id: "content-management",
      name: "コンテンツ管理",
      description: "地域・場所・チェックインの作成・編集・削除権限",
      permissions: ["content.create", "content.edit", "content.delete"],
      assignedRoles: ["編集者", "モデレーター", "管理者"],
      userCount: 135,
    },
    {
      id: "user-management",
      name: "ユーザー管理",
      description: "ユーザーアカウントの管理と権限設定",
      permissions: ["user.view", "user.edit", "user.delete", "user.suspend"],
      assignedRoles: ["管理者"],
      userCount: 12,
    },
    {
      id: "moderation",
      name: "モデレーション",
      description: "コンテンツの承認・却下・報告対応",
      permissions: ["content.moderate", "reports.handle", "user.warn"],
      assignedRoles: ["モデレーター", "管理者"],
      userCount: 46,
    },
    {
      id: "analytics",
      name: "分析・レポート",
      description: "システム分析データとレポートへのアクセス",
      permissions: ["analytics.view", "reports.export", "metrics.access"],
      assignedRoles: ["編集者", "モデレーター", "管理者"],
      userCount: 135,
    },
  ];
}

function getPermissionCategories() {
  return [
    {
      name: "content",
      displayName: "コンテンツ管理",
      icon: FileText,
      permissions: [
        {
          name: "content.create",
          displayName: "コンテンツ作成",
          user: false,
          editor: true,
          moderator: true,
          admin: true,
        },
        {
          name: "content.edit",
          displayName: "コンテンツ編集",
          user: false,
          editor: true,
          moderator: true,
          admin: true,
        },
        {
          name: "content.delete",
          displayName: "コンテンツ削除",
          user: false,
          editor: false,
          moderator: true,
          admin: true,
        },
        {
          name: "content.publish",
          displayName: "コンテンツ公開",
          user: false,
          editor: false,
          moderator: true,
          admin: true,
        },
      ],
    },
    {
      name: "user",
      displayName: "ユーザー管理",
      icon: Users,
      permissions: [
        {
          name: "user.view",
          displayName: "ユーザー閲覧",
          user: false,
          editor: false,
          moderator: true,
          admin: true,
        },
        {
          name: "user.edit",
          displayName: "ユーザー編集",
          user: false,
          editor: false,
          moderator: false,
          admin: true,
        },
        {
          name: "user.suspend",
          displayName: "ユーザー停止",
          user: false,
          editor: false,
          moderator: true,
          admin: true,
        },
        {
          name: "user.delete",
          displayName: "ユーザー削除",
          user: false,
          editor: false,
          moderator: false,
          admin: true,
        },
      ],
    },
    {
      name: "system",
      displayName: "システム管理",
      icon: Settings,
      permissions: [
        {
          name: "system.settings",
          displayName: "システム設定",
          user: false,
          editor: false,
          moderator: false,
          admin: true,
        },
        {
          name: "system.backup",
          displayName: "バックアップ",
          user: false,
          editor: false,
          moderator: false,
          admin: true,
        },
        {
          name: "system.logs",
          displayName: "ログ閲覧",
          user: false,
          editor: false,
          moderator: false,
          admin: true,
        },
        {
          name: "system.maintenance",
          displayName: "メンテナンス",
          user: false,
          editor: false,
          moderator: false,
          admin: true,
        },
      ],
    },
  ];
}
