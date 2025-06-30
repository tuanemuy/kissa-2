import { Skeleton } from "@/components/ui/skeleton";

interface RegionListSkeletonProps {
  count?: number;
}

export function RegionListSkeleton({ count = 6 }: RegionListSkeletonProps) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton items are static and don't change
          <div key={index} className="bg-card rounded-lg overflow-hidden">
            {/* Cover image skeleton */}
            <div className="aspect-video relative overflow-hidden">
              <Skeleton className="w-full h-full" />
            </div>

            <div className="p-6 space-y-4">
              {/* Title and favorite icon */}
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
                <Skeleton className="h-5 w-5 rounded-full ml-2" />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              {/* Address */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Tags */}
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>

              {/* Stats */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="mt-8 flex justify-center gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}
