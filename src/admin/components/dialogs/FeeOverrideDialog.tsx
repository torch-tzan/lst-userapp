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

import { useAffiliates } from "../../lib/adminAffiliatesStore";
import { addFeeOverride } from "../../lib/adminFeeSettingsStore";
import {
  AdminDialog,
  AdminDialogContent,
  AdminDialogDescription,
  AdminDialogFooter,
  AdminDialogHeader,
  AdminDialogTitle,
} from "../AdminDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const FeeOverrideDialog = ({ open, onOpenChange }: Props) => {
  const affiliates = useAffiliates();
  const candidates = affiliates.filter((a) => a.status !== "terminated");

  const [affiliateId, setAffiliateId] = useState<string>(candidates[0]?.id ?? "");
  const [rate, setRate] = useState<string>("10");
  const [appliedFrom, setAppliedFrom] = useState<string>(todayISO());

  useEffect(() => {
    if (open) {
      setAffiliateId(candidates[0]?.id ?? "");
      setRate("10");
      setAppliedFrom(todayISO());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const rateNum = Number.parseFloat(rate);
  const canSubmit =
    affiliateId !== "" && !Number.isNaN(rateNum) && rateNum >= 0 && rateNum <= 30 && appliedFrom !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    addFeeOverride({ affiliateId, rate: rateNum, appliedFrom });
    toast.success("加盟店別の手数料率を設定しました");
    onOpenChange(false);
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent>
        <AdminDialogHeader>
          <AdminDialogTitle>加盟店別の手数料率を設定</AdminDialogTitle>
          <AdminDialogDescription>
            特定の加盟店に対して、グローバル設定とは異なる手数料率を適用します。
          </AdminDialogDescription>
        </AdminDialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fee-affiliate">加盟店</Label>
            <Select value={affiliateId} onValueChange={setAffiliateId}>
              <SelectTrigger id="fee-affiliate">
                <SelectValue placeholder="加盟店を選択" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.storeName}（{a.id}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fee-rate">手数料率（%）</Label>
            <Input
              id="fee-rate"
              type="number"
              min={0}
              max={30}
              step={0.5}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fee-applied-from">適用開始日</Label>
            <Input
              id="fee-applied-from"
              type="date"
              value={appliedFrom}
              onChange={(e) => setAppliedFrom(e.target.value)}
            />
          </div>
        </div>

        <AdminDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            追加
          </Button>
        </AdminDialogFooter>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default FeeOverrideDialog;
