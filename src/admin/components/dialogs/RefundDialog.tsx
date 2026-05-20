import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 表示用識別子（取引 ID / 支払い ID） */
  targetId: string;
  /** 表示用金額（円） */
  amount: number;
  onConfirm: (reason: string) => void;
}

const RefundDialog = ({ open, onOpenChange, targetId, amount, onConfirm }: RefundDialogProps) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setSubmitting(false);
    }
  }, [open]);

  const canSubmit = reason.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    onConfirm(reason.trim());
    toast.success("返金処理を完了しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>返金処理</AdminDialogTitle>
          <AdminDialogDescription>
            ID <span className="font-mono">{targetId}</span> / 金額 ¥
            {amount.toLocaleString("ja-JP")} を返金します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="refund-reason">返金理由</Label>
          <Textarea
            id="refund-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="返金理由を入力"
          />
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!canSubmit}>
            返金する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default RefundDialog;
