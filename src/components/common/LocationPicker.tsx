"use client";

import { MapPin, Navigation, Search, Target } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

interface LocationPickerProps {
  value?: Location;
  onChange: (location: Location) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  showCoordinates?: boolean;
  allowManualInput?: boolean;
}

export function LocationPicker({
  value,
  onChange,
  className = "",
  disabled = false,
  required = false,
  showCoordinates = true,
  allowManualInput = true,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [geoLocationLoading, setGeoLocationLoading] = useState(false);

  // Mock geocoding function - in production, integrate with Google Maps or similar
  const mockGeocode = async (query: string): Promise<Location[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock results based on common Japanese locations
    const mockResults: Location[] = [
      {
        latitude: 35.6762,
        longitude: 139.6503,
        address: "東京都渋谷区",
        name: "渋谷区",
      },
      {
        latitude: 35.6586,
        longitude: 139.7454,
        address: "東京都千代田区丸の内1丁目",
        name: "東京駅",
      },
      {
        latitude: 35.7081,
        longitude: 139.7737,
        address: "東京都豊島区南池袋1丁目",
        name: "池袋駅",
      },
    ].filter(
      (location) =>
        location.name?.toLowerCase().includes(query.toLowerCase()) ||
        location.address?.toLowerCase().includes(query.toLowerCase()),
    );

    return mockResults;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const results = await mockGeocode(searchQuery);
      setSearchResults(results);

      if (results.length === 0) {
        setError(
          "検索結果が見つかりませんでした。別のキーワードで検索してみてください。",
        );
      }
    } catch (_err) {
      setError("検索中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    onChange(location);
    setSearchResults([]);
    setSearchQuery("");
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("このブラウザでは位置情報がサポートされていません。");
      return;
    }

    setGeoLocationLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: "現在地",
        };

        // In production, reverse geocode to get address
        // For now, just use the coordinates
        onChange(location);
        setGeoLocationLoading(false);
      },
      (_error) => {
        setError(
          "位置情報の取得に失敗しました。位置情報へのアクセスを許可してください。",
        );
        setGeoLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const handleManualCoordinateChange = (
    field: "latitude" | "longitude",
    inputValue: string,
  ) => {
    if (!inputValue) return;

    const numValue = Number.parseFloat(inputValue);
    if (Number.isNaN(numValue)) return;

    if (field === "latitude" && (numValue < -90 || numValue > 90)) {
      setError("緯度は-90から90の間で入力してください。");
      return;
    }

    if (field === "longitude" && (numValue < -180 || numValue > 180)) {
      setError("経度は-180から180の間で入力してください。");
      return;
    }

    setError(null);
    const updatedLocation: Location = {
      ...(value || { latitude: 0, longitude: 0 }),
      latitude: field === "latitude" ? numValue : value?.latitude || 0,
      longitude: field === "longitude" ? numValue : value?.longitude || 0,
    };

    onChange(updatedLocation);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Location Display */}
      {value && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">
                    {value.name || value.address || "選択された位置"}
                  </p>
                  {showCoordinates && (
                    <p className="text-sm text-muted-foreground">
                      緯度: {value.latitude.toFixed(6)}, 経度:{" "}
                      {value.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="secondary">選択済み</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">住所検索</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="住所、地名、駅名などで検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={disabled || isSearching}
            />
            <Button
              onClick={handleSearch}
              disabled={disabled || isSearching || !searchQuery.trim()}
              size="default"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">検索結果</Label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {searchResults.map((location, _index) => (
                  <button
                    type="button"
                    key={`${location.latitude},${location.longitude}`}
                    className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors border"
                    onClick={() => handleLocationSelect(location)}
                    disabled={disabled}
                  >
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {location.address}
                      </p>
                      {showCoordinates && (
                        <p className="text-xs text-muted-foreground">
                          {location.latitude.toFixed(4)},{" "}
                          {location.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">現在地を使用</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={getCurrentLocation}
            disabled={disabled || geoLocationLoading}
            className="w-full"
          >
            {geoLocationLoading ? (
              <>
                <Navigation className="h-4 w-4 mr-2 animate-spin" />
                位置情報を取得中...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                現在地を取得
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Manual Input */}
      {allowManualInput && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">座標で直接指定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">緯度</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="35.658581"
                  value={value?.latitude || ""}
                  onChange={(e) =>
                    handleManualCoordinateChange("latitude", e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">経度</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="139.745433"
                  value={value?.longitude || ""}
                  onChange={(e) =>
                    handleManualCoordinateChange("longitude", e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              正確な座標がわかる場合は、直接入力することもできます。
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Required Field Indicator */}
      {required && !value && (
        <Alert>
          <AlertDescription>
            位置情報の選択は必須です。上記の方法で位置を指定してください。
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
