import { RegionListSkeleton } from "@/components/region/RegionListSkeleton";

export default function RegionsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
      </div>

      <RegionListSkeleton count={9} />
    </div>
  );
}
