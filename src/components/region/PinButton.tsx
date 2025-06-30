"use client";

import { Pin } from "lucide-react";
import { startTransition, useActionState } from "react";
import { toast } from "sonner";
import { pinRegionAction } from "@/actions/pinned";
import { Button } from "@/components/ui/button";

interface PinButtonProps {
  regionId: string;
  isAuthenticated: boolean;
}

export function PinButton({ regionId, isAuthenticated }: PinButtonProps) {
  const [actionState, formAction, isPending] = useActionState(
    async () => await pinRegionAction(regionId),
    { result: undefined, error: null },
  );

  const handleClick = () => {
    if (!isAuthenticated) {
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    startTransition(() => {
      formAction();
    });
  };

  // Show success/error toasts based on action state
  if (actionState.error && isPending === false) {
    if (actionState.error.message === "Region is already pinned") {
      toast.info("この地域は既にピン留めされています。");
    } else {
      toast.error("ピン留めに失敗しました。");
    }
  }

  if (
    !actionState.error &&
    isPending === false &&
    actionState.result !== undefined
  ) {
    toast.success("地域をピン留めしました。");
  }

  return (
    <Button
      className="w-full"
      variant="outline"
      onClick={handleClick}
      disabled={isPending}
    >
      <Pin className="h-4 w-4 mr-2" />
      {isPending ? "ピン留め中..." : "ピン留めする"}
    </Button>
  );
}
