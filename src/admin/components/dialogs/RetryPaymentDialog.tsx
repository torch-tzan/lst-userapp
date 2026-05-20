import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface RetryPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  onConfirm: () => void;
}

const RetryPaymentDialog = ({ open, onOpenChange, paymentId, onConfirm }: RetryPaymentDialogProps) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);
    onConfirm();
    toast.success("支払いの再試行をキューに追加しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>支払いを再試行</AdminDialogTitle>
          <AdminDialogDescription>
            支払い <span className="font-mono">{paymentId}</span> を再試行します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <p className="text-sm text-slate-600">
          再試行は処理キューに追加され、決済会社へ再連携されます（mock）。
        </p>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            再試行する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default RetryPaymentDialog;
