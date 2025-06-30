"use client";

import { Clock, MapPin } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { toast } from "sonner";
import { createCheckinAction } from "@/actions/checkins";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CheckinButtonProps {
  placeId: string;
  placeName: string;
  isAuthenticated: boolean;
}

export function CheckinButton({
  placeId,
  placeName,
  isAuthenticated,
}: CheckinButtonProps) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [actionState, formAction, isPending] = useActionState(
    createCheckinAction,
    { result: undefined, error: null },
  );

  const handleCheckin = () => {
    if (!isAuthenticated) {
      window.location.href =
        "/auth/login?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }

    if (!navigator.geolocation) {
      toast.error("位置情報がサポートされていません。");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false);

        const formData = new FormData();
        formData.append("placeId", placeId);
        formData.append("comment", comment);
        formData.append("latitude", position.coords.latitude.toString());
        formData.append("longitude", position.coords.longitude.toString());
        formData.append("isPrivate", "false");

        startTransition(() => {
          formAction(formData);
        });
      },
      (error) => {
        setIsGettingLocation(false);
        console.error("Geolocation error:", error);
        toast.error("位置情報の取得に失敗しました。設定を確認してください。");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  // Show success/error toasts based on action state
  if (actionState.error && isPending === false) {
    toast.error("チェックインに失敗しました。");
  }

  if (
    !actionState.error &&
    isPending === false &&
    actionState.result !== undefined
  ) {
    toast.success("チェックインしました！");
    setOpen(false);
    setComment("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full"
          size="sm"
          disabled={!isAuthenticated}
        >
          <Clock className="h-4 w-4 mr-2" />
          チェックイン
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            {placeName}にチェックイン
          </DialogTitle>
          <DialogDescription>
            この場所での体験をシェアしましょう。位置情報を使用してチェックインします。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="comment">コメント（任意）</Label>
            <Textarea
              id="comment"
              placeholder="この場所での体験を教えてください..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          <Button
            onClick={handleCheckin}
            disabled={isPending || isGettingLocation}
            className="w-full"
          >
            {isGettingLocation ? (
              <>
                <MapPin className="h-4 w-4 mr-2 animate-pulse" />
                位置情報を取得中...
              </>
            ) : isPending ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                チェックイン中...
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                チェックイン
              </>
            )}
          </Button>
          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground text-center">
              チェックインするにはログインが必要です
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
