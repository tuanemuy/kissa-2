"use client";

import { useState, useTransition } from "react";
import { searchPlacesAction } from "@/actions/place";
import { PlaceSearchForm } from "@/components/place/PlaceSearchForm";
import { PlaceCard } from "@/components/place/PlaceCard";
import type { PlaceWithStats } from "@/core/domain/place/types";

interface PlaceSearchResultsProps {
  regionId: string;
  regionName: string;
}

export function PlaceSearchResults({ regionId, regionName }: PlaceSearchResultsProps) {
  const [searchResults, setSearchResults] = useState<PlaceWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleSearch = (keyword: string, searchRegionId?: string) => {
    setSearchTerm(keyword);
    
    startTransition(async () => {
      const { result } = await searchPlacesAction({
        keyword,
        pagination: {
          page: 1,
          limit: 20,
          order: "desc",
          orderBy: "createdAt",
        },
        regionId: searchRegionId,
      });
      
      if (result) {
        setSearchResults(result.items);
      }
    });
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {regionName}内を検索
        </h3>
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            検索をクリア
          </button>
        )}
      </div>
      
      <PlaceSearchForm
        regionId={regionId}
        onSearch={handleSearch}
        isLoading={isPending}
        placeholder={`${regionName}内の場所を検索...`}
      />

      {searchTerm && (
        <div>
          <h4 className="text-md font-medium mb-3">
            "{searchTerm}" の検索結果 ({searchResults.length}件)
          </h4>
          
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>該当する場所が見つかりませんでした。</p>
              <p className="text-sm mt-1">別のキーワードで検索してみてください。</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}