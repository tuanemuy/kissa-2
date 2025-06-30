import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  Eye,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Search,
  Shield,
  TrendingUp,
  UserX,
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
  title: "モデレーション - 管理者 - Kissa",
  description: "コンテンツの監視・報告対応・ユーザー管理を行います",
};

interface ModerationPageProps {
  searchParams: Promise<{
    tab?: string;
    type?: string;
    severity?: string;
    status?: string;
    keyword?: string;
  }>;
}

export default async function ModerationPage({
  searchParams,
}: ModerationPageProps) {
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
  const activeTab = params.tab || "reports";
  const type = params.type;
  const severity = params.severity;
  const status = params.status;
  const keyword = params.keyword || "";

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">モデレーション</h1>
            <p className="text-muted-foreground">
              コンテンツの監視・報告対応・ユーザー管理を行います
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              自動検知設定
            </Button>
            <Button variant="outline">
              <Ban className="h-4 w-4 mr-2" />
              一括対応
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">未対応報告</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">23</div>
              <p className="text-xs text-muted-foreground">要緊急対応</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月対応数</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% 先月比
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                停止ユーザー
              </CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">一時停止中</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">自動検知</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">AI検知件数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                平均対応時間
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3h</div>
              <p className="text-xs text-muted-foreground">目標: 4h以内</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>報告・案件を検索・絞り込み</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="flex gap-4">
              <input type="hidden" name="tab" value={activeTab} />
              <div className="flex-1">
                <Input
                  name="keyword"
                  placeholder="ユーザー名、コンテンツ、理由で検索..."
                  defaultValue={keyword}
                  className="w-full"
                />
              </div>
              <div className="w-40">
                <Select name="type" defaultValue={type || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="種類" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全ての種類</SelectItem>
                    <SelectItem value="user">ユーザー報告</SelectItem>
                    <SelectItem value="content">コンテンツ報告</SelectItem>
                    <SelectItem value="spam">スパム</SelectItem>
                    <SelectItem value="harassment">ハラスメント</SelectItem>
                    <SelectItem value="inappropriate">不適切</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select name="severity" defaultValue={severity || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="重要度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全ての重要度</SelectItem>
                    <SelectItem value="critical">緊急</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select name="status" defaultValue={status || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータス" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全てのステータス</SelectItem>
                    <SelectItem value="pending">未対応</SelectItem>
                    <SelectItem value="investigating">調査中</SelectItem>
                    <SelectItem value="resolved">解決済み</SelectItem>
                    <SelectItem value="dismissed">却下</SelectItem>
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

        {/* Moderation Tabs */}
        <Tabs value={activeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="reports" asChild>
              <Link href="/admin/moderation?tab=reports">報告一覧</Link>
            </TabsTrigger>
            <TabsTrigger value="users" asChild>
              <Link href="/admin/moderation?tab=users">ユーザー管理</Link>
            </TabsTrigger>
            <TabsTrigger value="automod" asChild>
              <Link href="/admin/moderation?tab=automod">自動検知</Link>
            </TabsTrigger>
            <TabsTrigger value="history" asChild>
              <Link href="/admin/moderation?tab=history">対応履歴</Link>
            </TabsTrigger>
            <TabsTrigger value="settings" asChild>
              <Link href="/admin/moderation?tab=settings">設定</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>報告一覧</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>報告</TableHead>
                      <TableHead>対象</TableHead>
                      <TableHead>報告者</TableHead>
                      <TableHead>重要度</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>報告日時</TableHead>
                      <TableHead>アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getReports().map((report) => (
                      <ReportRow key={report.id} report={report} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>問題ユーザー管理</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ユーザー</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>違反回数</TableHead>
                      <TableHead>最終違反</TableHead>
                      <TableHead>制裁レベル</TableHead>
                      <TableHead>アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getProblemUsers().map((problemUser) => (
                      <ProblemUserRow key={problemUser.id} user={problemUser} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automod" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>自動検知されたコンテンツ</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>コンテンツ</TableHead>
                      <TableHead>検知理由</TableHead>
                      <TableHead>信頼度</TableHead>
                      <TableHead>ユーザー</TableHead>
                      <TableHead>検知日時</TableHead>
                      <TableHead>アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getAutoDetectedContent().map((content) => (
                      <AutoDetectedRow key={content.id} content={content} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>モデレーション履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>対応内容</TableHead>
                      <TableHead>対象</TableHead>
                      <TableHead>実行者</TableHead>
                      <TableHead>理由</TableHead>
                      <TableHead>実行日時</TableHead>
                      <TableHead>詳細</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getModerationHistory().map((action) => (
                      <ModerationHistoryRow key={action.id} action={action} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>自動検知設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>スパム検知感度</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>不適切コンテンツ検知</Label>
                    <Select defaultValue="enabled">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">有効</SelectItem>
                        <SelectItem value="disabled">無効</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>自動削除しきい値</Label>
                    <Select defaultValue="high">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">自動削除しない</SelectItem>
                        <SelectItem value="high">信頼度90%以上</SelectItem>
                        <SelectItem value="medium">信頼度80%以上</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>制裁レベル設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>1回目の違反</Label>
                    <Select defaultValue="warning">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warning">警告</SelectItem>
                        <SelectItem value="temp_suspend">一時停止</SelectItem>
                        <SelectItem value="suspend">停止</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>2回目の違反</Label>
                    <Select defaultValue="temp_suspend">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warning">警告</SelectItem>
                        <SelectItem value="temp_suspend">一時停止</SelectItem>
                        <SelectItem value="suspend">停止</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>3回目以降の違反</Label>
                    <Select defaultValue="suspend">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temp_suspend">一時停止</SelectItem>
                        <SelectItem value="suspend">停止</SelectItem>
                        <SelectItem value="ban">永久停止</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function ReportRow({
  report,
}: {
  report: {
    id: string;
    type: string;
    reason: string;
    description: string;
    targetType: string;
    targetName: string;
    reportedBy: {
      name: string;
      avatar: string;
    };
    severity: string;
    status: string;
    createdAt: string;
  };
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{report.reason}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {report.description}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Badge variant="outline" className="text-xs">
            {report.targetType}
          </Badge>
          <div className="text-sm font-medium">{report.targetName}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={report.reportedBy.avatar} />
            <AvatarFallback>{report.reportedBy.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-sm">{report.reportedBy.name}</div>
        </div>
      </TableCell>
      <TableCell>
        <SeverityBadge severity={report.severity} />
      </TableCell>
      <TableCell>
        <StatusBadge status={report.status} />
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {new Date(report.createdAt).toLocaleDateString("ja-JP")}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(report.createdAt).toLocaleTimeString("ja-JP", {
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
              詳細を確認
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MessageSquare className="mr-2 h-4 w-4" />
              報告者に連絡
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              解決済みにする
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <XCircle className="mr-2 h-4 w-4" />
              却下する
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function ProblemUserRow({
  user,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    status: string;
    violationCount: number;
    lastViolation: string;
    sanctionLevel: string;
  };
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <UserStatusBadge status={user.status} />
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium">{user.violationCount}回</div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {new Date(user.lastViolation).toLocaleDateString("ja-JP")}
        </div>
      </TableCell>
      <TableCell>
        <SanctionBadge level={user.sanctionLevel} />
      </TableCell>
      <TableCell>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              制裁実行
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ユーザー制裁</DialogTitle>
              <DialogDescription>
                {user.name}さんに対する制裁を実行します。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="sanction-type">制裁種類</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="制裁を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">警告</SelectItem>
                    <SelectItem value="temp_suspend">一時停止</SelectItem>
                    <SelectItem value="suspend">アカウント停止</SelectItem>
                    <SelectItem value="ban">永久停止</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">理由</Label>
                <Textarea
                  id="reason"
                  placeholder="制裁の理由を入力してください..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">制裁を実行</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}

function AutoDetectedRow({
  content,
}: {
  content: {
    id: string;
    type: string;
    text: string;
    reason: string;
    confidence: number;
    author: {
      name: string;
      avatar: string;
    };
    detectedAt: string;
  };
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <Badge variant="outline" className="text-xs">
            {content.type}
          </Badge>
          <div className="text-sm line-clamp-2">{content.text}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">{content.reason}</div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium">{content.confidence}%</div>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full"
              style={{ width: `${content.confidence}%` }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={content.author.avatar} />
            <AvatarFallback>{content.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-sm">{content.author.name}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {new Date(content.detectedAt).toLocaleDateString("ja-JP")}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            承認
          </Button>
          <Button size="sm" variant="destructive">
            削除
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ModerationHistoryRow({
  action,
}: {
  action: {
    id: string;
    type: string;
    target: string;
    moderator: string;
    reason: string;
    executedAt: string;
  };
}) {
  return (
    <TableRow>
      <TableCell>
        <ActionBadge action={action.type} />
      </TableCell>
      <TableCell>
        <div className="text-sm">{action.target}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium">{action.moderator}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground">{action.reason}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {new Date(action.executedAt).toLocaleDateString("ja-JP")}
        </div>
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// Badge components
function SeverityBadge({ severity }: { severity: string }) {
  const severityConfig = {
    critical: { label: "緊急", variant: "destructive" as const },
    high: { label: "高", variant: "destructive" as const },
    medium: { label: "中", variant: "default" as const },
    low: { label: "低", variant: "secondary" as const },
  };

  const config = severityConfig[severity as keyof typeof severityConfig] || {
    label: severity,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { label: "未対応", variant: "destructive" as const },
    investigating: { label: "調査中", variant: "default" as const },
    resolved: { label: "解決済み", variant: "secondary" as const },
    dismissed: { label: "却下", variant: "outline" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function UserStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    active: { label: "アクティブ", variant: "default" as const },
    warned: { label: "警告済み", variant: "secondary" as const },
    suspended: { label: "停止中", variant: "destructive" as const },
    banned: { label: "永久停止", variant: "destructive" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function SanctionBadge({ level }: { level: string }) {
  const levelConfig = {
    none: { label: "制裁なし", variant: "outline" as const },
    warning: { label: "警告", variant: "secondary" as const },
    temp_suspend: { label: "一時停止", variant: "default" as const },
    suspend: { label: "停止", variant: "destructive" as const },
    ban: { label: "永久停止", variant: "destructive" as const },
  };

  const config = levelConfig[level as keyof typeof levelConfig] || {
    label: level,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function ActionBadge({ action }: { action: string }) {
  const actionConfig = {
    warning: { label: "警告発行", variant: "secondary" as const },
    suspend: { label: "アカウント停止", variant: "destructive" as const },
    delete: { label: "コンテンツ削除", variant: "default" as const },
    approve: { label: "承認", variant: "outline" as const },
  };

  const config = actionConfig[action as keyof typeof actionConfig] || {
    label: action,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Mock data functions
function getReports() {
  return [
    {
      id: "1",
      type: "user",
      reason: "ハラスメント",
      description: "他のユーザーに対する不適切な発言と嫌がらせ行為",
      targetType: "ユーザー",
      targetName: "問題ユーザー123",
      reportedBy: {
        name: "田中太郎",
        avatar: "",
      },
      severity: "high",
      status: "pending",
      createdAt: "2024-12-30T10:30:00Z",
    },
    {
      id: "2",
      type: "content",
      reason: "スパム",
      description: "同一内容を複数の場所に大量投稿",
      targetType: "チェックイン",
      targetName: "宣伝チェックイン",
      reportedBy: {
        name: "佐藤花子",
        avatar: "",
      },
      severity: "medium",
      status: "investigating",
      createdAt: "2024-12-30T09:15:00Z",
    },
  ];
}

function getProblemUsers() {
  return [
    {
      id: "1",
      name: "問題ユーザー123",
      email: "problem@example.com",
      avatar: "",
      status: "warned",
      violationCount: 2,
      lastViolation: "2024-12-30T10:30:00Z",
      sanctionLevel: "warning",
    },
    {
      id: "2",
      name: "スパマー456",
      email: "spammer@example.com",
      avatar: "",
      status: "suspended",
      violationCount: 5,
      lastViolation: "2024-12-29T15:20:00Z",
      sanctionLevel: "suspend",
    },
  ];
}

function getAutoDetectedContent() {
  return [
    {
      id: "1",
      type: "コメント",
      text: "これは自動検知されたスパムコンテンツの例です...",
      reason: "スパム検知",
      confidence: 92,
      author: {
        name: "スパマー456",
        avatar: "",
      },
      detectedAt: "2024-12-30T11:15:00Z",
    },
  ];
}

function getModerationHistory() {
  return [
    {
      id: "1",
      type: "warning",
      target: "問題ユーザー123",
      moderator: "管理者太郎",
      reason: "ハラスメント行為のため",
      executedAt: "2024-12-30T10:45:00Z",
    },
    {
      id: "2",
      type: "delete",
      target: "不適切なチェックイン",
      moderator: "管理者花子",
      reason: "規約違反のため削除",
      executedAt: "2024-12-30T09:30:00Z",
    },
  ];
}
