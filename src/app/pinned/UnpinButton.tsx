"use client";

import { PinOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { unpinRegionAction } from "@/actions/pinned";
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

interface UnpinButtonProps {
  regionId: string;
  regionName: string;
}

export function UnpinButton({ regionId, regionName }: UnpinButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUnpin = async () => {
    setIsLoading(true);

    try {
      const result = await unpinRegionAction(regionId);

      if (result.error) {
        toast.error("ピン留めの解除に失敗しました。");
      } else {
        toast.success(`${regionName}のピン留めを解除しました。`);
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
          <PinOff className="h-4 w-4" />
          <span className="sr-only">ピン留めを解除</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ピン留めを解除</DialogTitle>
          <DialogDescription>
            「{regionName}」のピン留めを解除しますか？
            <br />
            この地域は通常の地域一覧に表示されるようになります。
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
            onClick={handleUnpin}
            disabled={isLoading}
          >
            {isLoading ? "解除中..." : "解除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
