interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeatureShowcaseProps {
  title?: string;
  features?: Feature[];
}

const defaultFeatures: Feature[] = [
  {
    icon: "🗺️",
    title: "地域探索",
    description: "日本全国の魅力的な地域を発見し、詳細な情報を確認できます",
  },
  {
    icon: "📍",
    title: "チェックイン",
    description: "訪れた場所にチェックインして、思い出を記録しましょう",
  },
  {
    icon: "⭐",
    title: "お気に入り管理",
    description: "気に入った地域や場所をお気に入りに追加して管理できます",
  },
];

export function FeatureShowcase({
  title = "Kissaの特徴",
  features = defaultFeatures,
}: FeatureShowcaseProps) {
  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
