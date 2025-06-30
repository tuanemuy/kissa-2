"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlaceSearchFormProps {
  regionId?: string;
  onSearch: (keyword: string, regionId?: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function PlaceSearchForm({
  regionId,
  onSearch,
  isLoading = false,
  placeholder = "場所を検索...",
}: PlaceSearchFormProps) {
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim(), regionId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder={placeholder}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      <Button type="submit" disabled={isLoading || !keyword.trim()}>
        {isLoading ? "検索中..." : "検索"}
      </Button>
    </form>
  );
}
