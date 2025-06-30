import { Settings, User, Lock } from "lucide-react";
import type { Metadata } from "next";
import { getUserProfileAction } from "@/actions/settings";
import { UserLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./ProfileForm";
import { PasswordChangeForm } from "./PasswordChangeForm";

export const metadata: Metadata = {
  title: "アカウント設定 - Kissa",
  description: "プロフィール、パスワード、通知設定の管理",
};

export default async function SettingsPage() {
  const { result: user, error } = await getUserProfileAction();

  if (error) {
    console.error("Failed to get user profile:", error);
  }

  if (!user) {
    return (
      <UserLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            プロフィール情報を読み込めませんでした。
          </p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">アカウント設定</h1>
          <p className="text-muted-foreground">
            プロフィール情報、パスワード、通知設定を管理できます。
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              プロフィール
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              セキュリティ
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  プロフィール情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm user={user} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  パスワードの変更
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PasswordChangeForm />
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>アカウント情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      メールアドレス
                    </span>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      アカウント作成日
                    </span>
                    <p className="text-sm">
                      {user.createdAt.toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      ロール
                    </span>
                    <p className="text-sm capitalize">{user.role}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      ステータス
                    </span>
                    <p className="text-sm">
                      {user.status === "active" ? "アクティブ" : user.status}
                    </p>
                  </div>
                </div>

                {user.lastLoginAt && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      最終ログイン
                    </span>
                    <p className="text-sm">
                      {user.lastLoginAt.toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}
