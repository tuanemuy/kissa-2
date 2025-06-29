import { Card, CardHeader } from "@/components/ui/card";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Kissa</h1>
          <p className="mt-2 text-sm text-gray-600">
            地域の魅力を発見・共有するプラットフォーム
          </p>
        </div>
        <Card>
          <CardHeader className="pb-4">
            <div className="text-center">{children}</div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
