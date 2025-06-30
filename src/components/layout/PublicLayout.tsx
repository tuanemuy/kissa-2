import Link from "next/link";
import { getCurrentUserAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export async function PublicLayout({ children }: PublicLayoutProps) {
  const { result: user, error } = await getCurrentUserAction();

  if (error) {
    console.error("Failed to get current user:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-primary">
              Kissa
            </Link>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>地域を探す</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-[400px]">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/regions"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            すべての地域
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            登録されているすべての地域を一覧で確認
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/regions?category=popular"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            人気の地域
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            多くの人に愛されている人気地域
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/about"
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                    >
                      Kissaについて
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {user.name}さん
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">ダッシュボード</Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">ログイン</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/register">新規登録</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Kissa</h3>
              <p className="text-sm text-muted-foreground">
                地域の魅力を発見し、共有するプラットフォーム
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-4">サービス</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/regions"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    地域を探す
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Kissaについて
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-4">アカウント</h4>
              <ul className="space-y-2 text-sm">
                {user ? (
                  <>
                    <li>
                      <Link
                        href="/dashboard"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ダッシュボード
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/settings"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        設定
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link
                        href="/auth/login"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ログイン
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/auth/register"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        新規登録
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-4">サポート</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/help"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ヘルプ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    お問い合わせ
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Kissa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
