"use client";

import { Heart } from "lucide-react";
import { startTransition, useActionState } from "react";
import { toast } from "sonner";
import { addRegionToFavoritesAction } from "@/actions/favorites";
import { Button } from "@/components/ui/button";

interface FavoriteButtonProps {
  regionId: string;
  isAuthenticated: boolean;
}

export function FavoriteButton({
  regionId,
  isAuthenticated,
}: FavoriteButtonProps) {
  const [actionState, formAction, isPending] = useActionState(
    async () => await addRegionToFavoritesAction(regionId),
    { result: undefined, error: null },
  );

  const handleClick = () => {
    if (!isAuthenticated) {
      window.location.href =
        "/auth/login?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }

    startTransition(() => {
      formAction();
    });
  };

  // Show success/error toasts based on action state
  if (actionState.error && isPending === false) {
    if (actionState.error.message === "Region is already favorited") {
      toast.info("この地域は既にお気に入りに追加されています。");
    } else {
      toast.error("お気に入りへの追加に失敗しました。");
    }
  }

  if (
    !actionState.error &&
    isPending === false &&
    actionState.result !== undefined
  ) {
    toast.success("お気に入りに追加しました。");
  }

  return (
    <Button
      className="w-full"
      variant="outline"
      onClick={handleClick}
      disabled={isPending}
    >
      <Heart className="h-4 w-4 mr-2" />
      {isPending ? "追加中..." : "お気に入りに追加"}
    </Button>
  );
}
