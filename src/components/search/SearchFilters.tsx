"use client";

import {
  Camera,
  Clock,
  Filter,
  MapPin,
  Navigation,
  Star,
  Target,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  type Location,
  LocationPicker,
} from "@/components/common/LocationPicker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

interface SearchFiltersProps {
  type: "places" | "regions";
  onFiltersChange?: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  keyword?: string;
  category?: string;
  status?: string;
  tags?: string[];
  location?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  // Advanced filters
  minRating?: number;
  hasPhotos?: boolean;
  isOpenNow?: boolean;
  minCheckins?: number;
  businessHours?: {
    dayOfWeek?: number; // 0=Sunday, 1=Monday, etc.
    startTime?: string; // HH:MM format
    endTime?: string; // HH:MM format
  };
}

const placeCategories = [
  { value: "restaurant", label: "レストラン" },
  { value: "cafe", label: "カフェ" },
  { value: "hotel", label: "ホテル" },
  { value: "shopping", label: "ショッピング" },
  { value: "entertainment", label: "エンターテイメント" },
  { value: "culture", label: "文化" },
  { value: "nature", label: "自然" },
  { value: "historical", label: "歴史" },
  { value: "religious", label: "宗教" },
  { value: "transportation", label: "交通" },
  { value: "hospital", label: "病院" },
  { value: "education", label: "教育" },
  { value: "office", label: "オフィス" },
  { value: "other", label: "その他" },
];

const commonTags = [
  "人気",
  "おすすめ",
  "駅近",
  "WiFi",
  "駐車場",
  "子供連れ",
  "デート",
  "一人",
  "グループ",
  "屋外",
  "屋内",
  "24時間",
];

const sortOptions = [
  { value: "name", label: "名前" },
  { value: "createdAt", label: "作成日" },
  { value: "updatedAt", label: "更新日" },
  { value: "favoriteCount", label: "お気に入り数" },
  { value: "checkinCount", label: "チェックイン数" },
  { value: "rating", label: "評価" },
  { value: "distance", label: "距離" },
];

export function SearchFilters({ type, onFiltersChange }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<SearchFilters>(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius");
    const minRating = searchParams.get("minRating");
    const hasPhotos = searchParams.get("hasPhotos");
    const isOpenNow = searchParams.get("isOpenNow");
    const minCheckins = searchParams.get("minCheckins");

    return {
      keyword: searchParams.get("keyword") || "",
      category: searchParams.get("category") || "",
      status: searchParams.get("status") || "",
      tags: searchParams.get("tags")?.split(",").filter(Boolean) || [],
      location:
        lat && lng && radius
          ? {
              latitude: Number.parseFloat(lat),
              longitude: Number.parseFloat(lng),
              radiusKm: Number.parseFloat(radius),
            }
          : undefined,
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
      // Advanced filters
      minRating: minRating ? Number.parseFloat(minRating) : undefined,
      hasPhotos: hasPhotos === "true",
      isOpenNow: isOpenNow === "true",
      minCheckins: minCheckins ? Number.parseInt(minCheckins, 10) : undefined,
    };
  });

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange?.(updatedFilters);

    // Update URL params
    const params = new URLSearchParams(searchParams);

    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (
        value &&
        value !== "" &&
        (Array.isArray(value) ? value.length > 0 : true)
      ) {
        if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else if (key === "location" && typeof value === "object") {
          // Handle location object separately
          const loc = value as SearchFilters["location"];
          if (loc) {
            params.set("lat", loc.latitude.toString());
            params.set("lng", loc.longitude.toString());
            params.set("radius", loc.radiusKm.toString());
          }
        } else {
          params.set(key, value.toString());
        }
      } else {
        if (key === "location") {
          params.delete("lat");
          params.delete("lng");
          params.delete("radius");
        } else {
          params.delete(key);
        }
      }
    });

    // Reset page when filters change
    params.delete("page");

    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      keyword: "",
      category: "",
      status: "",
      tags: [],
      location: undefined,
      sortBy: "name",
      sortOrder: "asc",
      minRating: undefined,
      hasPhotos: false,
      isOpenNow: false,
      minCheckins: undefined,
    };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
    setShowLocationFilter(false);
    setLocationError(null);
    router.push(window.location.pathname);
  };

  const addTag = (tag: string) => {
    if (!filters.tags?.includes(tag)) {
      updateFilters({ tags: [...(filters.tags || []), tag] });
    }
  };

  const removeTag = (tag: string) => {
    updateFilters({ tags: filters.tags?.filter((t) => t !== tag) });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("このブラウザでは位置情報がサポートされていません。");
      return;
    }

    setGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radiusKm: 5, // Default 5km radius
        };
        updateFilters({ location });
        setShowLocationFilter(true);
        setGettingLocation(false);
      },
      () => {
        setLocationError(
          "位置情報の取得に失敗しました。位置情報へのアクセスを許可してください。",
        );
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const handleLocationChange = (location: Location) => {
    const locationFilter = {
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm: filters.location?.radiusKm || 5,
    };
    updateFilters({ location: locationFilter });
  };

  const handleRadiusChange = (values: number[]) => {
    if (filters.location) {
      updateFilters({
        location: {
          ...filters.location,
          radiusKm: values[0],
        },
      });
    }
  };

  const removeLocationFilter = () => {
    updateFilters({ location: undefined });
    setShowLocationFilter(false);
    setLocationError(null);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "sortBy" && value === "name") return false;
    if (key === "sortOrder" && value === "asc") return false;
    if (key === "hasPhotos" && value === false) return false;
    if (key === "isOpenNow" && value === false) return false;

    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object" && value !== null) return true; // location object
    return value && value !== "" && value !== undefined;
  }).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          フィルター
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>検索フィルター</SheetTitle>
          <SheetDescription>
            {type === "places" ? "場所" : "地域"}を絞り込んで検索できます
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Keyword */}
          <div className="space-y-2">
            <Label htmlFor="keyword">キーワード</Label>
            <Input
              id="keyword"
              placeholder="検索キーワードを入力"
              value={filters.keyword || ""}
              onChange={(e) => updateFilters({ keyword: e.target.value })}
            />
          </div>

          {/* Category (for places only) */}
          {type === "places" && (
            <div className="space-y-2">
              <Label htmlFor="category">カテゴリー</Label>
              <Select
                value={filters.category || ""}
                onValueChange={(value) => updateFilters({ category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべて</SelectItem>
                  {placeCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">ステータス</Label>
            <Select
              value={filters.status || ""}
              onValueChange={(value) => updateFilters({ status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ステータスを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべて</SelectItem>
                <SelectItem value="published">公開済み</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
                <SelectItem value="archived">アーカイブ済み</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>タグ</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {filters.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer">
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 hover:bg-transparent"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {commonTags.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag}
                    checked={filters.tags?.includes(tag) || false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        addTag(tag);
                      } else {
                        removeTag(tag);
                      }
                    }}
                  />
                  <Label
                    htmlFor={tag}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {tag}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>位置情報で絞り込み</Label>
              {filters.location && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeLocationFilter}
                >
                  <X className="h-3 w-3 mr-1" />
                  解除
                </Button>
              )}
            </div>

            {/* Current location filter display */}
            {filters.location && (
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    選択された位置から{filters.location.radiusKm}km以内
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  緯度: {filters.location.latitude.toFixed(4)}, 経度:{" "}
                  {filters.location.longitude.toFixed(4)}
                </p>

                {/* Radius slider */}
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    検索範囲: {filters.location.radiusKm}km
                  </Label>
                  <Slider
                    value={[filters.location.radiusKm]}
                    onValueChange={handleRadiusChange}
                    min={0.5}
                    max={50}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0.5km</span>
                    <span>50km</span>
                  </div>
                </div>
              </div>
            )}

            {/* Location action buttons */}
            {!filters.location && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? (
                    <>
                      <Navigation className="h-4 w-4 mr-2 animate-spin" />
                      現在地を取得中...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      現在地から検索
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowLocationFilter(!showLocationFilter)}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  住所から検索
                </Button>
              </div>
            )}

            {/* Location picker */}
            {showLocationFilter && !filters.location && (
              <div className="border rounded-md p-3">
                <LocationPicker
                  value={undefined}
                  onChange={handleLocationChange}
                  showCoordinates={false}
                  allowManualInput={false}
                />
              </div>
            )}

            {/* Location error */}
            {locationError && (
              <Alert variant="destructive">
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Advanced Filters - Places only */}
          {type === "places" && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium text-sm">詳細フィルター</h3>

                {/* Rating Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Star className="h-4 w-4 mr-2" />
                    最低評価
                  </Label>
                  <Select
                    value={filters.minRating?.toString() || ""}
                    onValueChange={(value) =>
                      updateFilters({
                        minRating: value ? Number.parseFloat(value) : undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="評価を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">指定なし</SelectItem>
                      <SelectItem value="1">★ 1以上</SelectItem>
                      <SelectItem value="2">★★ 2以上</SelectItem>
                      <SelectItem value="3">★★★ 3以上</SelectItem>
                      <SelectItem value="4">★★★★ 4以上</SelectItem>
                      <SelectItem value="5">★★★★★ 5のみ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Checkin Count Filter */}
                <div className="space-y-2">
                  <Label>最低チェックイン数</Label>
                  <Select
                    value={filters.minCheckins?.toString() || ""}
                    onValueChange={(value) =>
                      updateFilters({
                        minCheckins: value
                          ? Number.parseInt(value, 10)
                          : undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="チェックイン数を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">指定なし</SelectItem>
                      <SelectItem value="5">5回以上</SelectItem>
                      <SelectItem value="10">10回以上</SelectItem>
                      <SelectItem value="25">25回以上</SelectItem>
                      <SelectItem value="50">50回以上</SelectItem>
                      <SelectItem value="100">100回以上</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Boolean Filters */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasPhotos"
                      checked={filters.hasPhotos || false}
                      onCheckedChange={(checked) =>
                        updateFilters({ hasPhotos: Boolean(checked) })
                      }
                    />
                    <Label
                      htmlFor="hasPhotos"
                      className="flex items-center cursor-pointer"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      写真がある場所のみ
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isOpenNow"
                      checked={filters.isOpenNow || false}
                      onCheckedChange={(checked) =>
                        updateFilters({ isOpenNow: Boolean(checked) })
                      }
                    />
                    <Label
                      htmlFor="isOpenNow"
                      className="flex items-center cursor-pointer"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      現在営業中の場所のみ
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Sort */}
          <div className="space-y-2">
            <Label>並び順</Label>
            <div className="flex gap-2">
              <Select
                value={filters.sortBy || "name"}
                onValueChange={(value) => updateFilters({ sortBy: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.sortOrder || "asc"}
                onValueChange={(value) =>
                  updateFilters({ sortOrder: value as "asc" | "desc" })
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">昇順</SelectItem>
                  <SelectItem value="desc">降順</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear filters */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
            >
              フィルターをクリア
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
