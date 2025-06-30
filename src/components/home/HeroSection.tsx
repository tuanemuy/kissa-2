import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

export function HeroSection({
  title = "地域を探索し、お気に入りの場所を発見",
  subtitle = "Kissaで日本全国の魅力的な地域と場所を探索し、あなただけのお気に入りリストを作成しましょう",
  primaryButtonText = "地域を探索する",
  primaryButtonHref = "/regions",
  secondaryButtonText = "今すぐ始める",
  secondaryButtonHref = "/auth/register",
}: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16 md:py-24">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          {title.split("、").map((part, index, array) => (
            <span key={part}>
              {part}
              {index < array.length - 1 && (
                <>
                  、
                  <br />
                </>
              )}
            </span>
          ))}
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <a href={primaryButtonHref}>{primaryButtonText}</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={secondaryButtonHref}>{secondaryButtonText}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
