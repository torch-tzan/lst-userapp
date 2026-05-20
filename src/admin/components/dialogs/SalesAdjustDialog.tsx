import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { addAdjustTransaction } from "../../lib/adminSalesStore";
import type { SalesKind } from "../../lib/storeLabels";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface SalesAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const KIND_OPTIONS: { value: SalesKind; label: string }[] = [
  { value: "adjust", label: "調整" },
  { value: "other", label: "手数料免除" },
  { value: "other", label: "その他" },
];

const SalesAdjustDialog = ({ open, onOpenChange }: SalesAdjustDialogProps) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [kind, setKind] = useState<SalesKind>("adjust");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setReason("");
      setKind("adjust");
      setSubmitting(false);
    }
  }, [open]);

  const amountNum = Number.parseInt(amount, 10);
  const canSubmit = !Number.isNaN(amountNum) && reason.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    addAdjustTransaction({ amount: amountNum, reason: reason.trim(), kind });
    toast.success("調整を記録しました");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>手動調整</AdminDialogTitle>
          <AdminDialogDescription>
            売上の手動調整を記録します。マイナス値も可。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="adjust-amount">金額（円）</Label>
            <Input
              id="adjust-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例: 5000 / -3000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjust-kind">種別</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as SalesKind)}>
              <SelectTrigger id="adjust-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KIND_OPTIONS.map((opt, idx) => (
                  <SelectItem key={`${opt.value}-${idx}`} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjust-reason">理由</Label>
            <Textarea
              id="adjust-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="調整の理由を入力"
            />
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            戻る
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            記録する
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default SalesAdjustDialog;
