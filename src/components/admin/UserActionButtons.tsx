"use client";

import {
  Ban,
  Crown,
  Edit,
  Eye,
  Mail,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
} from "lucide-react";
import { startTransition, useState } from "react";
import { toast } from "sonner";
import {
  deleteUserAction,
  reactivateUserAction,
  suspendUserAction,
  updateUserRoleAction,
} from "@/actions/admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface UserActionButtonsProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
}

export function UserActionButtons({ user }: UserActionButtonsProps) {
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [newRole, setNewRole] = useState(user.role);
  const [isPending, setIsPending] = useState(false);

  const handleSuspendUser = () => {
    if (!suspendReason.trim()) {
      toast.error("停止理由を入力してください");
      return;
    }

    setIsPending(true);
    startTransition(async () => {
      const result = await suspendUserAction(user.id, suspendReason);
      setIsPending(false);
      setSuspendDialogOpen(false);
      setSuspendReason("");

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.result);
      }
    });
  };

  const handleReactivateUser = () => {
    setIsPending(true);
    startTransition(async () => {
      const result = await reactivateUserAction(user.id);
      setIsPending(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.result);
      }
    });
  };

  const handleDeleteUser = () => {
    setIsPending(true);
    startTransition(async () => {
      const result = await deleteUserAction(user.id);
      setIsPending(false);
      setDeleteDialogOpen(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.result);
      }
    });
  };

  const handleUpdateRole = () => {
    if (newRole === user.role) {
      setRoleDialogOpen(false);
      return;
    }

    setIsPending(true);
    startTransition(async () => {
      const result = await updateUserRoleAction(user.id, newRole);
      setIsPending(false);
      setRoleDialogOpen(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.result);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
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
            プロフィール編集
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRoleDialogOpen(true)}>
            <Shield className="mr-2 h-4 w-4" />
            権限を変更
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Mail className="mr-2 h-4 w-4" />
            メール送信
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.status === "active" ? (
            <DropdownMenuItem
              className="text-orange-600"
              onClick={() => setSuspendDialogOpen(true)}
            >
              <Ban className="mr-2 h-4 w-4" />
              アカウント停止
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-green-600"
              onClick={handleReactivateUser}
              disabled={isPending}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              アカウント復活
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            アカウント削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend User Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザーアカウント停止</DialogTitle>
            <DialogDescription>
              {user.name}さんのアカウントを停止しますか？
              この操作により、ユーザーはシステムにアクセスできなくなります。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="suspend-reason">停止理由</Label>
              <Textarea
                id="suspend-reason"
                placeholder="停止理由を入力してください..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialogOpen(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendUser}
              disabled={isPending || !suspendReason.trim()}
            >
              {isPending ? "停止中..." : "アカウント停止"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ユーザーアカウント削除</AlertDialogTitle>
            <AlertDialogDescription>
              {user.name}さんのアカウントを完全に削除しますか？
              この操作は取り消すことができません。
              すべての関連データも削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "削除中..." : "完全削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザー権限変更</DialogTitle>
            <DialogDescription>
              {user.name}さんの権限レベルを変更します。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-role">新しい権限レベル</Label>
              <Select value={newRole} onValueChange={setNewRole}>
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
            <div className="space-y-2">
              <Label>現在の権限</Label>
              <RoleBadge role={user.role} />
            </div>
            {newRole !== user.role && (
              <div className="space-y-2">
                <Label>変更後の権限</Label>
                <RoleBadge role={newRole} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRoleDialogOpen(false);
                setNewRole(user.role);
              }}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={isPending || newRole === user.role}
            >
              {isPending ? "更新中..." : "権限を更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
