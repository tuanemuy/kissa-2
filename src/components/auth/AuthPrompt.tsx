import { Heart, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthPromptProps {
  title?: string;
  description?: string;
  features?: string[];
  variant?: "default" | "compact";
  currentPath?: string;
}

export function AuthPrompt({
  title = "もっと楽しむために",
  description = "アカウントを作成して、Kissaの全機能をお楽しみください",
  features = [
    "お気に入りの地域・場所を保存",
    "場所にチェックイン",
    "ピン留めで素早くアクセス",
  ],
  variant = "default",
  currentPath = "/",
}: AuthPromptProps) {
  const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
  const registerUrl = `/auth/register?redirect=${encodeURIComponent(currentPath)}`;

  const featureIcons = [Heart, MapPin, Star];

  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <div className="flex gap-2 justify-center">
          <Button asChild size="sm">
            <Link href={registerUrl}>新規登録</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={loginUrl}>ログイン</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {features.map((feature, index) => {
            const Icon = featureIcons[index % featureIcons.length];
            return (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Icon className="h-4 w-4 text-primary" />
                <span>{feature}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 pt-2">
          <Button asChild className="flex-1">
            <Link href={registerUrl}>新規登録</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href={loginUrl}>ログイン</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}