import type { Metadata } from "next";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: "Kissa - 地域を探索し、お気に入りの場所を発見",
  description:
    "日本全国の魅力的な地域と場所を探索し、あなただけのお気に入りリストを作成しましょう",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
