"use client";

import {
  Bell,
  Clock,
  Globe,
  Heart,
  Mail,
  MapPin,
  Smartphone,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface NotificationPreferences {
  email: {
    enabled: boolean;
    frequency: "instant" | "daily" | "weekly" | "never";
    newCheckins: boolean;
    newFavorites: boolean;
    nearbyPlaces: boolean;
    systemUpdates: boolean;
    promotions: boolean;
  };
  push: {
    enabled: boolean;
    newCheckins: boolean;
    newFavorites: boolean;
    nearbyPlaces: boolean;
    systemUpdates: boolean;
    friendActivity: boolean;
  };
  inApp: {
    enabled: boolean;
    newCheckins: boolean;
    newFavorites: boolean;
    nearbyPlaces: boolean;
    systemUpdates: boolean;
    friendActivity: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    shareLocation: boolean;
    allowFriendRequests: boolean;
    publicProfile: boolean;
  };
}

interface NotificationSettingsProps {
  onSave: (preferences: NotificationPreferences) => Promise<void>;
  initialPreferences?: NotificationPreferences;
  disabled?: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email: {
    enabled: true,
    frequency: "daily",
    newCheckins: true,
    newFavorites: true,
    nearbyPlaces: false,
    systemUpdates: true,
    promotions: false,
  },
  push: {
    enabled: true,
    newCheckins: true,
    newFavorites: true,
    nearbyPlaces: true,
    systemUpdates: true,
    friendActivity: false,
  },
  inApp: {
    enabled: true,
    newCheckins: true,
    newFavorites: true,
    nearbyPlaces: true,
    systemUpdates: true,
    friendActivity: true,
  },
  privacy: {
    showOnlineStatus: true,
    shareLocation: false,
    allowFriendRequests: true,
    publicProfile: true,
  },
};

export function NotificationSettings({
  onSave,
  initialPreferences = defaultPreferences,
  disabled = false,
}: NotificationSettingsProps) {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    setPushSupported("Notification" in window && "serviceWorker" in navigator);
  }, []);

  const updatePreference = <T extends keyof NotificationPreferences>(
    category: T,
    field: keyof NotificationPreferences[T],
    value: NotificationPreferences[T][keyof NotificationPreferences[T]],
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(preferences);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) return;

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      updatePreference("push", "enabled", true);
    }
  };

  const getPermissionStatus = () => {
    if (!pushSupported) return "unsupported";
    return Notification.permission;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">通知設定</h2>
        <p className="text-muted-foreground">
          お知らせやアクティビティの通知方法をカスタマイズできます
        </p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            メール通知
          </CardTitle>
          <CardDescription>重要な更新情報をメールで受け取る</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-enabled">メール通知を有効にする</Label>
            <Switch
              id="email-enabled"
              checked={preferences.email.enabled}
              onCheckedChange={(checked) =>
                updatePreference("email", "enabled", checked)
              }
              disabled={disabled}
            />
          </div>

          {preferences.email.enabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>配信頻度</Label>
                  <Select
                    value={preferences.email.frequency}
                    onValueChange={(value) =>
                      updatePreference(
                        "email",
                        "frequency",
                        value as "never" | "instant" | "daily" | "weekly",
                      )
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">即座に</SelectItem>
                      <SelectItem value="daily">1日1回</SelectItem>
                      <SelectItem value="weekly">週1回</SelectItem>
                      <SelectItem value="never">配信しない</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: "newCheckins",
                      label: "新しいチェックイン",
                      icon: MapPin,
                    },
                    {
                      key: "newFavorites",
                      label: "お気に入り追加",
                      icon: Heart,
                    },
                    {
                      key: "nearbyPlaces",
                      label: "近くの新しい場所",
                      icon: Globe,
                    },
                    { key: "systemUpdates", label: "システム更新", icon: Bell },
                    { key: "promotions", label: "プロモーション", icon: Users },
                  ].map(({ key, label, icon: Icon }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <Label className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </Label>
                      <Switch
                        checked={
                          preferences.email[
                            key as keyof typeof preferences.email
                          ] as boolean
                        }
                        onCheckedChange={(checked) =>
                          updatePreference(
                            "email",
                            key as keyof typeof preferences.email,
                            checked,
                          )
                        }
                        disabled={disabled}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            プッシュ通知
            {getPermissionStatus() === "granted" && (
              <Badge variant="secondary" className="ml-2">
                許可済み
              </Badge>
            )}
            {getPermissionStatus() === "denied" && (
              <Badge variant="destructive" className="ml-2">
                拒否済み
              </Badge>
            )}
          </CardTitle>
          <CardDescription>リアルタイムで重要な通知を受け取る</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported && (
            <Alert>
              <AlertDescription>
                このブラウザではプッシュ通知がサポートされていません。
              </AlertDescription>
            </Alert>
          )}

          {pushSupported && getPermissionStatus() === "default" && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>プッシュ通知を有効にするには許可が必要です。</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestPushPermission}
                >
                  許可する
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="push-enabled">プッシュ通知を有効にする</Label>
            <Switch
              id="push-enabled"
              checked={preferences.push.enabled}
              onCheckedChange={(checked) =>
                updatePreference("push", "enabled", checked)
              }
              disabled={
                disabled ||
                !pushSupported ||
                getPermissionStatus() !== "granted"
              }
            />
          </div>

          {preferences.push.enabled && pushSupported && (
            <>
              <Separator />
              <div className="space-y-3">
                {[
                  {
                    key: "newCheckins",
                    label: "新しいチェックイン",
                    icon: MapPin,
                  },
                  { key: "newFavorites", label: "お気に入り追加", icon: Heart },
                  {
                    key: "nearbyPlaces",
                    label: "近くの新しい場所",
                    icon: Globe,
                  },
                  { key: "systemUpdates", label: "システム更新", icon: Bell },
                  {
                    key: "friendActivity",
                    label: "友達のアクティビティ",
                    icon: Users,
                  },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                    <Switch
                      checked={
                        preferences.push[
                          key as keyof typeof preferences.push
                        ] as boolean
                      }
                      onCheckedChange={(checked) =>
                        updatePreference(
                          "push",
                          key as keyof typeof preferences.push,
                          checked,
                        )
                      }
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            アプリ内通知
          </CardTitle>
          <CardDescription>アプリ使用中に表示される通知</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="inapp-enabled">アプリ内通知を有効にする</Label>
            <Switch
              id="inapp-enabled"
              checked={preferences.inApp.enabled}
              onCheckedChange={(checked) =>
                updatePreference("inApp", "enabled", checked)
              }
              disabled={disabled}
            />
          </div>

          {preferences.inApp.enabled && (
            <>
              <Separator />
              <div className="space-y-3">
                {[
                  {
                    key: "newCheckins",
                    label: "新しいチェックイン",
                    icon: MapPin,
                  },
                  { key: "newFavorites", label: "お気に入り追加", icon: Heart },
                  {
                    key: "nearbyPlaces",
                    label: "近くの新しい場所",
                    icon: Globe,
                  },
                  { key: "systemUpdates", label: "システム更新", icon: Bell },
                  {
                    key: "friendActivity",
                    label: "友達のアクティビティ",
                    icon: Users,
                  },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                    <Switch
                      checked={
                        preferences.inApp[
                          key as keyof typeof preferences.inApp
                        ] as boolean
                      }
                      onCheckedChange={(checked) =>
                        updatePreference(
                          "inApp",
                          key as keyof typeof preferences.inApp,
                          checked,
                        )
                      }
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            プライバシー設定
          </CardTitle>
          <CardDescription>他のユーザーに表示される情報を管理</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              {
                key: "showOnlineStatus",
                label: "オンライン状態を表示",
                icon: Clock,
              },
              { key: "shareLocation", label: "位置情報を共有", icon: MapPin },
              {
                key: "allowFriendRequests",
                label: "友達リクエストを許可",
                icon: Users,
              },
              {
                key: "publicProfile",
                label: "プロフィールを公開",
                icon: Globe,
              },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </Label>
                <Switch
                  checked={
                    preferences.privacy[
                      key as keyof typeof preferences.privacy
                    ] as boolean
                  }
                  onCheckedChange={(checked) =>
                    updatePreference(
                      "privacy",
                      key as keyof typeof preferences.privacy,
                      checked,
                    )
                  }
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {lastSaved && (
            <span>最終保存: {lastSaved.toLocaleString("ja-JP")}</span>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving || disabled} size="lg">
          {saving ? "保存中..." : "設定を保存"}
        </Button>
      </div>
    </div>
  );
}
