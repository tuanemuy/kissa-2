"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SortControlsProps {
  type: "places" | "regions";
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  className?: string;
}

const sortOptions = {
  places: [
    { value: "name", label: "名前" },
    { value: "createdAt", label: "作成日" },
    { value: "updatedAt", label: "更新日" },
    { value: "favoriteCount", label: "お気に入り数" },
    { value: "checkinCount", label: "チェックイン数" },
    { value: "category", label: "カテゴリー" },
  ],
  regions: [
    { value: "name", label: "名前" },
    { value: "createdAt", label: "作成日" },
    { value: "updatedAt", label: "更新日" },
    { value: "favoriteCount", label: "お気に入り数" },
    { value: "placeCount", label: "場所数" },
  ],
};

export function SortControls({
  type,
  onSortChange,
  className = "",
}: SortControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSortBy = searchParams.get("sortBy") || "name";
  const currentSortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const updateSort = (sortBy?: string, sortOrder?: "asc" | "desc") => {
    const newSortBy = sortBy || currentSortBy;
    const newSortOrder = sortOrder || currentSortOrder;

    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set("sortBy", newSortBy);
    params.set("sortOrder", newSortOrder);

    // Reset page when sort changes
    params.delete("page");

    router.push(`?${params.toString()}`);
    onSortChange?.(newSortBy, newSortOrder);
  };

  const toggleSortOrder = () => {
    const newOrder = currentSortOrder === "asc" ? "desc" : "asc";
    updateSort(undefined, newOrder);
  };

  const handleSortByChange = (value: string) => {
    updateSort(value, undefined);
  };

  const getSortIcon = () => {
    if (currentSortOrder === "asc") {
      return <ArrowUp className="h-4 w-4" />;
    }
    return <ArrowDown className="h-4 w-4" />;
  };

  const getSortOrderLabel = () => {
    return currentSortOrder === "asc" ? "昇順" : "降順";
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Sort By Select */}
      <Select value={currentSortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions[type].map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort Order Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleSortOrder}
        className="flex items-center gap-1"
        title={`現在: ${getSortOrderLabel()}`}
      >
        {getSortIcon()}
        <span className="hidden sm:inline">{getSortOrderLabel()}</span>
      </Button>
    </div>
  );
}

// Compact version for mobile/tight spaces
export function CompactSortControls({
  type,
  onSortChange,
  className = "",
}: SortControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSortBy = searchParams.get("sortBy") || "name";
  const currentSortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const updateSort = (sortBy: string, sortOrder: "asc" | "desc") => {
    const params = new URLSearchParams(searchParams);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    params.delete("page");

    router.push(`?${params.toString()}`);
    onSortChange?.(sortBy, sortOrder);
  };

  const sortValue = `${currentSortBy}_${currentSortOrder}`;

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("_") as [string, "asc" | "desc"];
    updateSort(sortBy, sortOrder);
  };

  const options = sortOptions[type].flatMap((option) => [
    {
      value: `${option.value}_asc`,
      label: `${option.label} (昇順)`,
    },
    {
      value: `${option.value}_desc`,
      label: `${option.label} (降順)`,
    },
  ]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <Select value={sortValue} onValueChange={handleSortChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
