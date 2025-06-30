"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  removePlaceFromFavoritesAction,
  removeRegionFromFavoritesAction,
} from "@/actions/favorites";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RemoveFavoriteButtonProps {
  type: "region" | "place";
  id: string;
  name: string;
}

export function RemoveFavoriteButton({
  type,
  id,
  name,
}: RemoveFavoriteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async () => {
    setIsLoading(true);

    try {
      const result =
        type === "region"
          ? await removeRegionFromFavoritesAction(id)
          : await removePlaceFromFavoritesAction(id);

      if (result.error) {
        toast.error("お気に入りの削除に失敗しました。");
      } else {
        toast.success(`${name}をお気に入りから削除しました。`);
        setIsOpen(false);
      }
    } catch (_error) {
      toast.error("予期しないエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">お気に入りから削除</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>お気に入りから削除</DialogTitle>
          <DialogDescription>
            「{name}」をお気に入りから削除しますか？
            <br />
            この操作は元に戻すことができません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isLoading}
          >
            {isLoading ? "削除中..." : "削除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
