"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { reorderPinnedRegionsAction } from "@/actions/pinned";
import { Button } from "@/components/ui/button";
import { PinnedRegionCard } from "./page";

interface ReorderablePinnedListProps {
  regions: Array<{
    id: string;
    name: string;
    description?: string;
    coverImage?: string;
    placeCount: number;
    favoriteCount: number;
    tags: string[];
    pinDisplayOrder?: number;
  }>;
}

export function ReorderablePinnedList({ regions }: ReorderablePinnedListProps) {
  const [localRegions, setLocalRegions] = useState(
    regions.sort((a, b) => (a.pinDisplayOrder || 0) - (b.pinDisplayOrder || 0)),
  );
  const [isReordering, setIsReordering] = useState(false);

  const moveRegion = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === localRegions.length - 1)
    ) {
      return;
    }

    const newRegions = [...localRegions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Swap regions
    [newRegions[index], newRegions[targetIndex]] = [
      newRegions[targetIndex],
      newRegions[index],
    ];

    setLocalRegions(newRegions);
    await saveOrder(newRegions);
  };

  const saveOrder = async (reorderedRegions: typeof localRegions) => {
    setIsReordering(true);

    try {
      const regionIds = reorderedRegions.map((region) => region.id);
      const formData = new FormData();
      formData.append("regionIds", JSON.stringify(regionIds));

      const result = await reorderPinnedRegionsAction(
        { result: undefined, error: null },
        formData,
      );

      if (result.error) {
        toast.error("順序の保存に失敗しました。");
        // Revert to original order on error
        setLocalRegions(regions);
      } else {
        toast.success("順序を更新しました。");
      }
    } catch (_error) {
      toast.error("予期しないエラーが発生しました。");
      // Revert to original order on error
      setLocalRegions(regions);
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="space-y-4">
      {localRegions.map((region, index) => (
        <div key={region.id} className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {/* Region Card */}
            <div className="lg:col-span-2">
              <PinnedRegionCard
                region={{
                  ...region,
                  pinDisplayOrder: index,
                }}
              />
            </div>

            {/* Reorder Controls */}
            <div className="flex lg:flex-col gap-2 justify-center lg:justify-start items-center lg:items-start pt-4">
              <div className="text-sm text-muted-foreground mb-2 hidden lg:block">
                表示順序
              </div>
              <div className="flex lg:flex-col gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveRegion(index, "up")}
                  disabled={index === 0 || isReordering}
                  className="h-8 w-8 p-0"
                >
                  <ChevronUp className="h-4 w-4" />
                  <span className="sr-only">上に移動</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveRegion(index, "down")}
                  disabled={index === localRegions.length - 1 || isReordering}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">下に移動</span>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center lg:mt-2">
                {index + 1} / {localRegions.length}
              </div>
            </div>
          </div>

          {/* Loading overlay */}
          {isReordering && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
              <div className="text-sm text-muted-foreground">保存中...</div>
            </div>
          )}
        </div>
      ))}

      {localRegions.length > 1 && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 ヒント: 上下のボタンを使って表示順序を変更できます。
            変更は自動的に保存されます。
          </p>
        </div>
      )}
    </div>
  );
}
