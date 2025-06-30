import { Skeleton } from "@/components/ui/skeleton";

interface PlaceListSkeletonProps {
  count?: number;
}

export function PlaceListSkeleton({ count = 4 }: PlaceListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton items are static and don't change
        <div key={index} className="bg-card rounded-lg overflow-hidden">
          {/* Cover image skeleton */}
          <div className="aspect-video relative overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>

          <div className="p-4 space-y-3">
            {/* Title and favorite icon */}
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
              <Skeleton className="h-5 w-5 rounded-full ml-2" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Place details (address, phone, hours) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>

            {/* Category and checkin count */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
