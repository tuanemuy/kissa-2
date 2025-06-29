import { HeartIcon, MapPinIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getFeaturedRegionsAction } from "@/actions/region";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

async function FeaturedRegions() {
  try {
    const featuredRegions = await getFeaturedRegionsAction(6);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredRegions.map((region) => (
          <Link key={region.id} href={`/regions/${region.id}`}>
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <CardTitle className="line-clamp-2">{region.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 line-clamp-3 mb-4">
                  {region.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{region.placeCount || 0} 箇所</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HeartIcon className="h-4 w-4" />
                    <span>{region.favoriteCount || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  } catch (_error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">注目地域の読み込みに失敗しました</p>
      </div>
    );
  }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
              地域の魅力を
              <br className="hidden sm:block" />
              発見・共有しよう
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Kissaは地域の素晴らしい場所を発見し、仲間と共有できるプラットフォームです。
              あなたの地元の隠れた名所を見つけて、新しい体験をしてみませんか？
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/regions">
                <Button size="lg" className="w-full sm:w-auto">
                  地域を探す
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  今すぐ始める
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              地域を検索
            </h2>
            <form action="/regions" method="GET" className="flex gap-4">
              <div className="flex-1">
                <Input
                  name="keyword"
                  placeholder="地域名や特徴で検索..."
                  className="h-12 text-lg"
                />
              </div>
              <Button type="submit" size="lg">
                <SearchIcon className="h-5 w-5 mr-2" />
                検索
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Featured Regions */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">注目の地域</h2>
            <p className="mt-4 text-lg text-gray-600">
              人気の地域をチェックして、新しい発見をしてみましょう
            </p>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="h-48 animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }
          >
            <FeaturedRegions />
          </Suspense>

          <div className="text-center mt-12">
            <Link href="/regions">
              <Button variant="outline" size="lg">
                すべての地域を見る
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Kissaの特徴</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <SearchIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                簡単検索
              </h3>
              <p className="text-gray-600">
                キーワードや位置情報で、あなたにぴったりの地域や場所を簡単に見つけられます。
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <MapPinIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                チェックイン
              </h3>
              <p className="text-gray-600">
                実際に訪れた場所にチェックインして、写真やコメントでその魅力を共有しましょう。
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <HeartIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                お気に入り
              </h3>
              <p className="text-gray-600">
                気に入った地域や場所をお気に入りに登録して、いつでも簡単にアクセスできます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            今すぐKissaを始めよう
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            無料でアカウントを作成して、地域の魅力的な場所を発見・共有しませんか？
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              無料で始める
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
