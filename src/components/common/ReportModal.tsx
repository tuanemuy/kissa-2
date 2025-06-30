"use client";

import { AlertTriangle, Flag } from "lucide-react";
import { startTransition, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface ReportModalProps {
  contentType: "region" | "place" | "checkin" | "user";
  contentId: string;
  contentTitle: string;
  trigger?: React.ReactNode;
}

const reportReasons = {
  region: [
    { value: "inappropriate_content", label: "不適切なコンテンツ" },
    { value: "false_information", label: "虚偽の情報" },
    { value: "spam", label: "スパム" },
    { value: "copyright_violation", label: "著作権侵害" },
    { value: "offensive_language", label: "不適切な言葉遣い" },
    { value: "other", label: "その他" },
  ],
  place: [
    { value: "inappropriate_content", label: "不適切なコンテンツ" },
    { value: "false_information", label: "虚偽の情報" },
    { value: "closed_business", label: "閉店済み・存在しない" },
    { value: "wrong_location", label: "間違った場所" },
    { value: "spam", label: "スパム" },
    { value: "copyright_violation", label: "著作権侵害" },
    { value: "other", label: "その他" },
  ],
  checkin: [
    { value: "inappropriate_content", label: "不適切なコンテンツ" },
    { value: "false_information", label: "虚偽の情報" },
    { value: "fake_checkin", label: "偽装チェックイン" },
    { value: "inappropriate_image", label: "不適切な画像" },
    { value: "offensive_language", label: "不適切な言葉遣い" },
    { value: "spam", label: "スパム" },
    { value: "other", label: "その他" },
  ],
  user: [
    { value: "harassment", label: "嫌がらせ・ハラスメント" },
    { value: "spam", label: "スパム行為" },
    { value: "fake_account", label: "偽アカウント" },
    { value: "inappropriate_behavior", label: "不適切な行動" },
    { value: "impersonation", label: "なりすまし" },
    { value: "offensive_profile", label: "不適切なプロフィール" },
    { value: "other", label: "その他" },
  ],
};

export function ReportModal({
  contentType,
  contentId,
  contentTitle,
  trigger,
}: ReportModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmitReport = () => {
    if (!selectedReason) {
      toast.error("通報理由を選択してください");
      return;
    }

    setIsPending(true);
    startTransition(async () => {
      try {
        // TODO: Implement actual report submission
        console.log("Submitting report:", {
          contentType,
          contentId,
          reason: selectedReason,
          details: additionalDetails,
        });

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast.success("通報を送信しました。運営チームが確認いたします。");
        setOpen(false);
        resetForm();
      } catch (error) {
        console.error("Failed to submit report:", error);
        toast.error("通報の送信に失敗しました。もう一度お試しください。");
      } finally {
        setIsPending(false);
      }
    });
  };

  const resetForm = () => {
    setSelectedReason("");
    setAdditionalDetails("");
  };

  const reasons = reportReasons[contentType] || [];

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="text-muted-foreground">
      <Flag className="h-4 w-4 mr-2" />
      通報
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
            コンテンツを通報
          </DialogTitle>
          <DialogDescription>
            「{contentTitle}」について不適切な内容を報告します。
            すべての通報は運営チームが確認いたします。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Reason */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              通報理由を選択してください
            </Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="space-y-2"
            >
              {reasons.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={reason.value}
                    id={reason.value}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={reason.value}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="details">詳細情報（任意）</Label>
            <Textarea
              id="details"
              placeholder="問題の詳細や追加情報があれば入力してください..."
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              rows={3}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              具体的な問題点や状況を記載していただくと、迅速な対応が可能です。
            </p>
          </div>

          {/* Warning Message */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-medium mb-1">通報について</p>
                <p>
                  虚偽の通報や悪意のある通報は禁止されています。
                  適切な理由がない通報を繰り返し行った場合、
                  アカウントが制限される場合があります。
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubmitReport}
            disabled={isPending || !selectedReason}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "送信中..." : "通報を送信"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
